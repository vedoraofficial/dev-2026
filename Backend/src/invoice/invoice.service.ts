import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  In,
  Repository,
  TransactionCommitEvent,
  TransactionRollbackEvent,
} from 'typeorm';
import PDFDocument from 'pdfkit';
import { Order, PaymentStatus } from '../order/entity/order.entity';
import { UserProfile } from '../user/entity/user-profile.entity';
import { MailService } from '../notification/mail.service';
import { Invoice, InvoiceOrder } from './entity/invoice.entity';
import { INVOICE_QUEUE_KEY } from './invoice-queue';

/** The built-in PDF font has no ₹ sign, so amounts are written as "Rs. 1,999.00". */
const rs = (paise: number) =>
  `Rs. ${(Number(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Indian financial year of a date, e.g. 2026-27 (April to March, in IST). */
function financialYear(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

const sameState = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * GST invoices: one per payment — a single order, or every order of a cart paid together. Numbered
 * once (VED/2026-27/000001), built as a PDF on demand, and emailed to the buyer after the payment
 * commits. Nothing here can fail a payment — invoice errors are only logged.
 */
@Injectable()
export class InvoiceService implements EntitySubscriberInterface {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceOrder)
    private readonly invoiceOrderRepo: Repository<InvoiceOrder>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    // Listen for transaction commits (see queueInvoice)
    dataSource.subscribers.push(this);
  }

  // ─── After a payment commits ───

  afterTransactionCommit(event: TransactionCommitEvent) {
    // Also fired when a nested savepoint is released — wait for the real COMMIT.
    if (event.queryRunner.isTransactionActive) return;
    const data = event.queryRunner.data as Record<string, unknown>;
    const orderIds = (data[INVOICE_QUEUE_KEY] as number[] | undefined) ?? [];
    delete data[INVOICE_QUEUE_KEY];
    // Orders paid in the same transaction (a cart) share one invoice and one email.
    if (orderIds.length) void this.issueAndEmail(orderIds);
  }

  afterTransactionRollback(event: TransactionRollbackEvent) {
    if (event.queryRunner.isTransactionActive) return;
    delete (event.queryRunner.data as Record<string, unknown>)[INVOICE_QUEUE_KEY];
  }

  /** Never throws — the orders are already paid; an invoice problem must not surface there. */
  private async issueAndEmail(orderIds: number[]) {
    try {
      const invoices = await this.issue(orderIds);
      for (const invoice of invoices) await this.emailInvoice(invoice);
    } catch (error: any) {
      this.logger.warn(`Invoice for order(s) #${orderIds.join(', #')} not issued/emailed: ${error?.message ?? error}`);
    }
  }

  // ─── Numbering ───

  /**
   * Issues one invoice per buyer for the given paid orders that don't have one yet (normally all
   * from one buyer, so one invoice).
   */
  async issue(orderIds: number[]): Promise<Invoice[]> {
    const invoiced = await this.invoiceOrderRepo.find({ where: { orderId: In(orderIds) } });
    const done = new Set(invoiced.map((i) => Number(i.orderId)));
    const orders = (await this.orderRepo.find({ where: { id: In(orderIds) } })).filter(
      (o) => o.paymentStatus === PaymentStatus.PAID && !done.has(Number(o.id)),
    );

    const byBuyer = new Map<number, number[]>();
    for (const o of orders) byBuyer.set(o.userId, [...(byBuyer.get(o.userId) ?? []), Number(o.id)]);

    const invoices: Invoice[] = [];
    for (const [userId, ids] of byBuyer) {
      const invoice = await this.create(userId, ids);
      if (invoice) invoices.push(invoice);
    }
    return invoices;
  }

  private async create(userId: number, orderIds: number[]): Promise<Invoice | null> {
    const fy = financialYear(new Date());
    // Two invoices issued at the same moment can pick the same number — retry on the unique key.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.dataSource.transaction(async (manager) => {
          const { next } = await manager
            .getRepository(Invoice)
            .createQueryBuilder('i')
            .select('COALESCE(MAX(i.seq), 0) + 1', 'next')
            .where('i.financial_year = :fy', { fy })
            .getRawOne();
          const seq = Number(next);
          const invoice = await manager.getRepository(Invoice).save(
            manager.getRepository(Invoice).create({
              userId,
              financialYear: fy,
              seq,
              invoiceNumber: `VED/${fy}/${String(seq).padStart(6, '0')}`,
            }),
          );
          await manager
            .getRepository(InvoiceOrder)
            .insert(orderIds.map((orderId) => ({ invoiceId: invoice.id, orderId })));
          return invoice;
        });
      } catch (error: any) {
        if (error?.code !== '23505') throw error;
        // An order got its invoice meanwhile (parallel download / email) — nothing more to do.
        if (String(error?.detail ?? '').includes('order_id')) return null;
      }
    }
    throw new Error('Could not allocate an invoice number.');
  }

  /** The invoice an order is on, issuing a single-order invoice when it has none yet. */
  async forOrder(orderId: number): Promise<Invoice | null> {
    const link = await this.invoiceOrderRepo.findOne({ where: { orderId } });
    if (link) return this.invoiceRepo.findOne({ where: { id: link.invoiceId } });
    await this.issue([orderId]);
    const created = await this.invoiceOrderRepo.findOne({ where: { orderId } });
    return created ? this.invoiceRepo.findOne({ where: { id: created.invoiceId } }) : null;
  }

  // ─── Download ───

  /** GET /api/invoice/order/:orderId — the buyer or Admin. */
  async pdfForUser(orderId: number, requester: { sub?: number; id?: number; role?: string }) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');
    const requesterId = Number(requester.sub ?? requester.id);
    if (Number(order.userId) !== requesterId && requester.role !== 'ADMIN') {
      throw new ForbiddenException('You can only download invoices for your own orders.');
    }
    const invoice = await this.forOrder(orderId);
    if (!invoice) throw new BadRequestException('The invoice is available once the order is paid.');
    return { invoice, pdf: await this.buildPdf(invoice) };
  }

  /** File name for a download / attachment, e.g. VED-2026-27-000001.pdf */
  fileName(invoice: Invoice) {
    return `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
  }

  private async ordersOf(invoice: Invoice): Promise<Order[]> {
    const links = await this.invoiceOrderRepo.find({ where: { invoiceId: invoice.id } });
    return this.orderRepo.find({
      where: { id: In(links.map((l) => l.orderId)) },
      relations: { user: true, product: true },
      order: { id: 'ASC' },
    });
  }

  // ─── Email ───

  private async emailInvoice(invoice: Invoice) {
    if (invoice.emailedAt) return;
    const orders = await this.ordersOf(invoice);
    const buyer = orders[0]?.user;
    if (!buyer?.email) return;

    const pdf = await this.buildPdf(invoice, orders);
    const result = await this.mailService.sendInvoiceEmail(
      buyer.email,
      {
        name: buyer.name,
        invoiceNumber: invoice.invoiceNumber,
        orderIds: orders.map((o) => Number(o.id)),
        products: orders.map((o) => `${o.product?.name ?? 'Product'} × ${o.quantity}`),
        amountFormatted: rs(orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)),
      },
      { filename: this.fileName(invoice), content: pdf },
    );
    // Simulated (mail not configured) doesn't count as sent
    if (result.success && !result.simulated) {
      await this.invoiceRepo.update(invoice.id, { emailedAt: new Date() });
    }
  }

  // ─── PDF ───

  private company() {
    const get = (key: string, fallback = '') => this.configService.get<string>(key)?.trim() || fallback;
    return {
      name: get('COMPANY_LEGAL_NAME', 'VEDORA'),
      address: get('COMPANY_ADDRESS'),
      state: get('COMPANY_STATE', 'Maharashtra'),
      gstin: get('COMPANY_GSTIN'),
      email: get('SMTP_USER', 'info@vedoraofficial.com'),
      hsn: get('INVOICE_HSN_CODE', '7117'),
      gstRate: Number(get('INVOICE_GST_RATE', '3')) || 0,
    };
  }

  async buildPdf(invoice: Invoice, preloaded?: Order[]): Promise<Buffer> {
    const orders = preloaded ?? (await this.ordersOf(invoice));
    if (!orders.length) throw new NotFoundException('Invoice has no orders.');
    const buyer = orders[0].user;
    const profile = await this.profileRepo.findOne({ where: { user: { id: invoice.userId } } });
    const company = this.company();

    // Prices include GST — split each line into taxable value + tax.
    const lines = orders.map((o) => {
      const amount = Number(o.totalAmount);
      return {
        order: o,
        amount,
        taxable: Math.round((amount * 100) / (100 + company.gstRate)),
        unitTaxable: Math.round((Number(o.unitPrice) * 100) / (100 + company.gstRate)),
      };
    });
    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    const taxable = lines.reduce((sum, l) => sum + l.taxable, 0);
    const tax = total - taxable;
    // Same state as the company → CGST + SGST; another state → IGST
    const intraState = !profile?.state || sameState(profile.state, company.state);
    const cgst = intraState ? Math.floor(tax / 2) : 0;
    const sgst = intraState ? tax - cgst : 0;
    const igst = intraState ? 0 : tax;

    const issued = invoice.issuedAt.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const address = [
      profile?.addressLine1,
      profile?.addressLine2,
      [profile?.city, profile?.state].filter(Boolean).join(', '),
      profile?.pincode,
    ]
      .filter(Boolean)
      .join(', ');
    const orderNos = orders.map((o) => `#${o.id}`).join(', ');
    const methods = [...new Set(orders.map((o) => o.paymentMethod))].join(', ');
    const paymentIds = [...new Set(orders.map((o) => o.razorpayPaymentId).filter(Boolean))].join(', ');

    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice ${invoice.invoiceNumber}` } });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    const left = 48;
    const width = doc.page.width - 96;
    const gold = '#9A7B2F';
    const muted = '#666666';

    // Seller
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(20).text(company.name, left, 48);
    doc.fillColor(muted).font('Helvetica').fontSize(9);
    if (company.address) doc.text(company.address, { width: 300 });
    doc.text(`State: ${company.state}`);
    if (company.gstin) doc.text(`GSTIN: ${company.gstin}`);
    doc.text(company.email);

    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(company.gstin ? 'TAX INVOICE' : 'INVOICE', left, 48, { width, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor(muted);
    doc.text(`Invoice no: ${invoice.invoiceNumber}`, { width, align: 'right' });
    doc.text(`Date: ${issued}`, { width, align: 'right' });
    doc.text(`Order${orders.length > 1 ? 's' : ''}: ${orderNos}`, { width, align: 'right' });
    doc.text(`Payment: ${methods}${paymentIds ? ` (${paymentIds})` : ''}`, { width, align: 'right' });

    // Buyer
    let y = 150;
    doc.moveTo(left, y).lineTo(left + width, y).strokeColor('#DDDDDD').stroke();
    y += 12;
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(9).text('BILL TO', left, y);
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text(buyer.name, left, y + 14);
    doc.font('Helvetica').fontSize(9).fillColor(muted);
    doc.text(`VEDORA ID: ${buyer.vedId}`);
    if (buyer.mobile) doc.text(`Mobile: ${buyer.mobile}`);
    if (buyer.email) doc.text(`Email: ${buyer.email}`);
    if (address) doc.text(address, { width: 320 });
    doc.text(`Place of supply: ${profile?.state || company.state}`);

    // Items — one row per order
    y = Math.max(doc.y + 18, 260);
    const cols = [
      { label: 'Item', x: left, w: 190, align: 'left' as const },
      { label: 'HSN', x: left + 190, w: 50, align: 'left' as const },
      { label: 'Qty', x: left + 240, w: 35, align: 'right' as const },
      { label: 'Rate', x: left + 275, w: 75, align: 'right' as const },
      { label: 'Taxable value', x: left + 350, w: 80, align: 'right' as const },
      { label: 'Amount', x: left + 430, w: width - 430, align: 'right' as const },
    ];
    doc.rect(left, y, width, 20).fill('#F4EFE2');
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9);
    for (const c of cols) doc.text(c.label, c.x + 4, y + 6, { width: c.w - 8, align: c.align });
    y += 26;
    doc.font('Helvetica').fontSize(9);
    for (const line of lines) {
      const row = [
        `${line.order.product?.name ?? 'Product'} (order #${line.order.id})`,
        company.hsn,
        String(line.order.quantity),
        rs(line.unitTaxable),
        rs(line.taxable),
        rs(line.amount),
      ];
      cols.forEach((c, i) => doc.text(row[i], c.x + 4, y, { width: c.w - 8, align: c.align }));
      y += 22;
    }
    doc.moveTo(left, y).lineTo(left + width, y).strokeColor('#DDDDDD').stroke();

    // Totals
    y += 10;
    const line = (label: string, value: string, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9).fillColor('#000000');
      doc.text(label, left + width - 260, y, { width: 160, align: 'right' });
      doc.text(value, left + width - 100, y, { width: 100, align: 'right' });
      y += bold ? 20 : 15;
    };
    line('Taxable value', rs(taxable));
    if (intraState) {
      line(`CGST @ ${company.gstRate / 2}%`, rs(cgst));
      line(`SGST @ ${company.gstRate / 2}%`, rs(sgst));
    } else {
      line(`IGST @ ${company.gstRate}%`, rs(igst));
    }
    line('Total (incl. GST)', rs(total), true);

    // Footer
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(muted)
      .text(
        'Prices include GST. This is a computer-generated invoice and does not need a signature.',
        left,
        y + 30,
        { width, align: 'center' },
      );

    doc.end();
    return done;
  }
}
