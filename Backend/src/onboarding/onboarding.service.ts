import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, LessThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { GenealogyService, RegistrationDetails } from '../genealogy/genealogy.service';
import { GenealogyNode } from '../genealogy/entity/genealogy-node.entity';
import { OrderService } from '../order/order.service';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../order/entity/order.entity';
import { Product, ProductStatus } from '../product/entity/product.entity';
import { StockMovement, StockMovementType } from '../stock/entity/stock-movement.entity';
import { getAvailableStock } from '../stock/stock-levels';
import { User, UserStatus } from '../user/entity/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionCategory, WalletTransaction } from '../wallet/entity/wallet-transaction.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';
import { ExternalPaymentHandler, PaymentRequester, PaymentService } from '../payment/payment.service';
import { RegisterWithOrderDto } from './dto/register-with-order.dto';
import { PendingRegistration, PendingRegistrationStatus } from './entity/pending-registration.entity';

/** Razorpay receipt prefix of a partner-registration payment */
const JOIN_PREFIX = 'JOIN_';

const formatPaise = (paise: number) => `₹${(Number(paise) / 100).toFixed(2)}`;

/**
 * Add Partner with a paid joining order: the sponsor pays from their wallet or with Razorpay, and
 * the partner (plus a PAID order in the partner's name, ready to ship) is created only once the
 * payment succeeds.
 */
@Injectable()
export class OnboardingService implements OnModuleInit, ExternalPaymentHandler {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PendingRegistration)
    private readonly pendingRepo: Repository<PendingRegistration>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly genealogyService: GenealogyService,
    private readonly orderService: OrderService,
    private readonly walletService: WalletService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit() {
    this.paymentService.registerExternalHandler(this);
  }

  async registerWithOrder(sponsorUserId: number, dto: RegisterWithOrderDto) {
    const { productId, quantity = 1, paymentMethod, ...details } = dto;

    const product = await this.orderableProduct(this.productRepo.manager, productId, quantity);
    const amount = Number(product.salePrice) * quantity;

    // Refuse up front what the registration would refuse anyway, before any money moves.
    await this.genealogyService.validateRegistration(sponsorUserId, details);

    if (paymentMethod === PaymentMethod.WALLET) {
      return this.registerWithWallet(sponsorUserId, details, product, quantity, amount);
    }
    return this.startRazorpayRegistration(sponsorUserId, details, product, quantity, amount);
  }

  // ─── Wallet: one transaction — nothing is created unless the debit goes through ───

  private async registerWithWallet(
    sponsorUserId: number,
    details: RegistrationDetails,
    product: Product,
    quantity: number,
    amount: number,
  ) {
    const wallet = await this.walletService.getWalletSummary(sponsorUserId);
    if (wallet.availableBalance < amount) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ${wallet.availableBalanceFormatted}, Required: ${formatPaise(amount)}`,
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const registered = await this.genealogyService.registerPartnerInTransaction(
          manager,
          sponsorUserId,
          details,
        );
        const walletTxn = await this.walletService.debit(
          sponsorUserId,
          amount,
          TransactionCategory.ORDER_PAYMENT,
          `Joining order for ${registered.partner.vedId}: ${product.name} × ${quantity}`,
          'ORDER',
          undefined,
          manager,
        );
        const order = await this.createPaidJoiningOrder(manager, {
          partnerId: registered.partner.id,
          sponsorUserId,
          productId: Number(product.id),
          quantity,
          paymentMethod: PaymentMethod.WALLET,
          note: `Joining order for ${registered.partner.vedId} (paid from sponsor wallet)`,
        });
        await manager
          .getRepository(WalletTransaction)
          .update(walletTxn.id, { referenceId: String(order.id) });

        return {
          status: 'COMPLETED' as const,
          message: `${registered.partner.name} registered as ${registered.partner.vedId}. Joining order #${order.id} is paid and ready to ship.`,
          partner: { ...registered.partner, status: UserStatus.ACTIVE },
          order: this.orderSummary(order, product),
        };
      });
    } catch (error: any) {
      throw this.genealogyService.toRegistrationError(error);
    }
  }

  // ─── Razorpay: hold the registration until the payment is confirmed ───

  private async startRazorpayRegistration(
    sponsorUserId: number,
    details: RegistrationDetails,
    product: Product,
    quantity: number,
    amount: number,
  ) {
    const { password, ...safeDetails } = details;
    if (!password) throw new BadRequestException('Password is required.');

    const sponsor = await this.dataSource.getRepository(User).findOne({ where: { id: sponsorUserId } });
    const checkout = await this.paymentService.createRazorpayCheckout({
      amount,
      receipt: `${JOIN_PREFIX}${sponsorUserId}_${Date.now().toString().slice(-6)}`,
      description: `Joining order for ${details.name}: ${product.name} × ${quantity}`,
      notes: { type: 'PARTNER_REGISTRATION', sponsorUserId: String(sponsorUserId) },
      prefill: { name: sponsor?.name, email: sponsor?.email ?? undefined, contact: sponsor?.mobile },
    });

    await this.pendingRepo.save(
      this.pendingRepo.create({
        sponsorUserId,
        details: safeDetails,
        passwordHash: await bcrypt.hash(password, 10),
        productId: Number(product.id),
        quantity,
        amount,
        status: PendingRegistrationStatus.PENDING,
        razorpayOrderId: checkout.orderId,
      }),
    );
    this.logger.log(`Razorpay registration payment initiated by user #${sponsorUserId}: ${checkout.orderId}`);

    return {
      status: 'PAYMENT_REQUIRED' as const,
      message: 'Complete the Razorpay payment — the partner is registered once it succeeds.',
      razorpayOrderId: checkout.orderId,
      checkout,
      amount,
      partnerName: details.name,
    };
  }

  // ─── ExternalPaymentHandler (called by PaymentService) ───

  async owns(razorpayOrderId: string): Promise<boolean> {
    return (await this.pendingRepo.count({ where: { razorpayOrderId } })) > 0;
  }

  /** POST /api/payment/verify: the Razorpay signature is already checked — create the partner. */
  async complete(razorpayOrderId: string, razorpayPaymentId: string) {
    const pending = await this.pendingRepo.findOne({ where: { razorpayOrderId } });
    if (!pending) throw new NotFoundException(`Registration not found for Razorpay order: ${razorpayOrderId}`);
    if (pending.status === PendingRegistrationStatus.PENDING) {
      await this.completePaidRegistration(pending.id, razorpayPaymentId);
    }
    return this.describe(pending.id);
  }

  /** Status check / webhook / reconciliation for a registration payment. */
  async checkAndProcess(razorpayOrderId: string, _eventType: string, requestingUser?: PaymentRequester) {
    const pending = await this.pendingRepo.findOne({ where: { razorpayOrderId } });
    if (!pending) {
      throw new NotFoundException(`Registration not found for Razorpay order: ${razorpayOrderId}`);
    }

    if (requestingUser) {
      const requesterId = Number(requestingUser.sub || requestingUser.id);
      if (Number(pending.sponsorUserId) !== requesterId && requestingUser.role !== 'ADMIN') {
        throw new ForbiddenException('You do not have permission to check this payment.');
      }
    }

    if (pending.status === PendingRegistrationStatus.PENDING) {
      const paymentId = await this.paymentService.fetchCapturedPaymentId(razorpayOrderId);
      if (paymentId) await this.completePaidRegistration(pending.id, paymentId);
    }

    return this.describe(pending.id);
  }

  async findStalePending(olderThan: Date): Promise<string[]> {
    const rows = await this.pendingRepo.find({
      where: { status: PendingRegistrationStatus.PENDING, createdAt: LessThan(olderThan) },
      select: { razorpayOrderId: true },
      take: 50,
    });
    return rows.map((r) => r.razorpayOrderId);
  }

  /** Paid: create the partner and their PAID joining order; refund the sponsor if that fails. */
  private async completePaidRegistration(pendingId: number, razorpayPaymentId: string | null) {
    try {
      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(PendingRegistration);
        const row = await repo.findOne({ where: { id: pendingId }, lock: { mode: 'pessimistic_write' } });
        if (!row || row.status !== PendingRegistrationStatus.PENDING) return;

        const registered = await this.registerWithSlotFallback(manager, row);
        const order = await this.createPaidJoiningOrder(manager, {
          partnerId: registered.partner.id,
          sponsorUserId: row.sponsorUserId,
          productId: Number(row.productId),
          quantity: row.quantity,
          paymentMethod: PaymentMethod.RAZORPAY,
          razorpayOrderId: row.razorpayOrderId,
          razorpayPaymentId,
          note: `Joining order for ${registered.partner.vedId} (Razorpay)`,
        });

        row.status = PendingRegistrationStatus.COMPLETED;
        row.createdUserId = registered.partner.id;
        row.orderId = Number(order.id);
        row.razorpayPaymentId = razorpayPaymentId;
        row.passwordHash = null;
        await repo.save(row);
      });
    } catch (error: any) {
      const reason = this.genealogyService.toRegistrationError(error)?.message ?? 'Registration failed.';
      this.logger.error(`Paid registration ${pendingId} could not be completed: ${reason}`);
      await this.settleWithoutPartner(pendingId, PendingRegistrationStatus.REFUNDED, reason, razorpayPaymentId);
    }
  }

  /** The chosen slot may have been filled while the sponsor was paying — then take the next free one. */
  private async registerWithSlotFallback(manager: EntityManager, row: PendingRegistration) {
    const details = row.details as RegistrationDetails;
    const passwordHash = row.passwordHash ?? undefined;
    if (details.slotNumber == null) {
      return this.genealogyService.registerPartnerInTransaction(manager, row.sponsorUserId, details, passwordHash);
    }
    try {
      return await manager.transaction((inner) =>
        this.genealogyService.registerPartnerInTransaction(inner, row.sponsorUserId, details, passwordHash),
      );
    } catch (error: any) {
      const slotTaken =
        String(error?.message ?? '').includes('is already occupied') ||
        (error?.code === '23505' && String(error?.detail ?? '').includes('slot_number'));
      if (!slotTaken) throw error;
      return this.genealogyService.registerPartnerInTransaction(
        manager,
        row.sponsorUserId,
        { ...details, slotNumber: undefined },
        passwordHash,
      );
    }
  }

  /**
   * Ends a registration with no partner created. When the sponsor had already paid (REFUNDED),
   * the amount goes back to their wallet.
   */
  private async settleWithoutPartner(
    pendingId: number,
    status: PendingRegistrationStatus.FAILED | PendingRegistrationStatus.REFUNDED,
    reason: string,
    razorpayPaymentId: string | null = null,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PendingRegistration);
      const row = await repo.findOne({ where: { id: pendingId }, lock: { mode: 'pessimistic_write' } });
      if (!row || row.status !== PendingRegistrationStatus.PENDING) return;

      if (status === PendingRegistrationStatus.REFUNDED) {
        await this.walletService.credit(
          row.sponsorUserId,
          Number(row.amount),
          TransactionCategory.REFUND,
          `Refund: partner ${row.details.name} could not be registered after the Razorpay payment`,
          'REGISTRATION',
          String(row.id),
          manager,
        );
        await this.notificationService.create(
          row.sponsorUserId,
          NotificationKey.PAYMENT_FAILED,
          `${formatPaise(row.amount)} refunded to your wallet`,
          `Your Razorpay payment went through, but ${row.details.name} could not be registered (${reason}). The amount is back in your wallet.`,
          { razorpayOrderId: row.razorpayOrderId, refundPaise: Number(row.amount) },
          manager,
        );
        await this.notificationService.notifyAllAdmins(
          NotificationKey.ADMIN_ORDER_CANCELLED,
          'Paid registration refunded',
          `A Razorpay joining payment (${row.razorpayOrderId}, ${razorpayPaymentId ?? 'no payment id'}) was refunded to the sponsor's wallet: ${reason}`,
          { razorpayOrderId: row.razorpayOrderId, pendingRegistrationId: Number(row.id) },
          manager,
        );
      }

      row.status = status;
      row.failureReason = reason;
      row.razorpayPaymentId = razorpayPaymentId ?? row.razorpayPaymentId;
      row.passwordHash = null;
      await repo.save(row);
    });
  }

  // ─── Shared ───

  /** Active, in stock — the same rules as a normal order. */
  private async orderableProduct(manager: EntityManager, productId: number, quantity: number) {
    const product = await manager.getRepository(Product).findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found.');
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Product is currently inactive.');
    }
    const inStock = await getAvailableStock(manager, Number(product.id));
    if (inStock < quantity) {
      throw new BadRequestException(
        inStock <= 0 ? 'This product is out of stock.' : `Only ${inStock} left in stock.`,
      );
    }
    return product;
  }

  /**
   * The new partner's PAID, CONFIRMED joining order (ships to their profile address): takes the
   * stock, pays the uplines' commissions and activates the partner.
   */
  private async createPaidJoiningOrder(
    manager: EntityManager,
    params: {
      partnerId: number;
      sponsorUserId: number;
      productId: number;
      quantity: number;
      paymentMethod: PaymentMethod;
      razorpayOrderId?: string;
      razorpayPaymentId?: string | null;
      note: string;
    },
  ): Promise<Order> {
    const product = await this.orderableProduct(manager, params.productId, params.quantity);
    const unitPrice = Number(product.salePrice);

    const orderRepo = manager.getRepository(Order);
    const order = await orderRepo.save(
      orderRepo.create({
        userId: params.partnerId,
        productId: product.id,
        quantity: params.quantity,
        unitPrice,
        totalAmount: unitPrice * params.quantity,
        bvTotal: Number(product.bvAmount) * params.quantity,
        paymentMethod: params.paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.CONFIRMED,
        razorpayOrderId: params.razorpayOrderId ?? null,
        razorpayPaymentId: params.razorpayPaymentId ?? null,
      }),
    );

    await manager.getRepository(StockMovement).save(
      manager.getRepository(StockMovement).create({
        productId: Number(product.id),
        type: StockMovementType.OUT,
        quantity: params.quantity,
        note: `${params.note} · order #${order.id}`,
        createdBy: params.sponsorUserId,
      }),
    );

    // Paid joining order → the partner is active (and can earn on their own team).
    await manager.getRepository(User).update(params.partnerId, { status: UserStatus.ACTIVE });

    await this.orderService.distributeCommissions(Number(order.id), manager);

    await this.notificationService.create(
      params.partnerId,
      NotificationKey.PAYMENT_SUCCESS,
      `Joining order #${order.id} confirmed`,
      `Your joining order (${product.name} × ${params.quantity}, ${formatPaise(order.totalAmount)}) is paid. It ships to your registered address in 24–48 business hours.`,
      { orderId: Number(order.id) },
      manager,
    );

    return order;
  }

  private orderSummary(order: Order, product: Product) {
    return {
      id: Number(order.id),
      productName: product.name,
      quantity: order.quantity,
      totalAmount: Number(order.totalAmount),
      totalAmountFormatted: formatPaise(order.totalAmount),
      bvTotal: Number(order.bvTotal),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    };
  }

  /** What payment verify / GET /api/payment/status/:razorpayOrderId return for a registration. */
  private async describe(pendingId: number) {
    const row = await this.pendingRepo.findOneOrFail({ where: { id: pendingId } });
    const paymentStatus = {
      [PendingRegistrationStatus.PENDING]: 'PENDING',
      [PendingRegistrationStatus.COMPLETED]: 'PAID',
      [PendingRegistrationStatus.FAILED]: 'FAILED',
      [PendingRegistrationStatus.REFUNDED]: 'REFUNDED',
    }[row.status];

    let partner: Record<string, unknown> | undefined;
    if (row.createdUserId) {
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: row.createdUserId } });
      const node = await this.dataSource
        .getRepository(GenealogyNode)
        .findOne({ where: { userId: row.createdUserId } });
      if (user) {
        partner = { id: user.id, vedId: user.vedId, name: user.name, status: user.status, slotNumber: node?.slotNumber };
      }
    }

    const message = {
      [PendingRegistrationStatus.PENDING]: 'Waiting for the Razorpay payment.',
      [PendingRegistrationStatus.COMPLETED]: `Payment received — ${row.details.name} is registered.`,
      [PendingRegistrationStatus.FAILED]: row.failureReason ?? 'Payment failed. The partner was not registered.',
      [PendingRegistrationStatus.REFUNDED]: `Payment received, but ${row.details.name} could not be registered: ${row.failureReason}. ${formatPaise(row.amount)} was refunded to your wallet.`,
    }[row.status];

    return {
      message,
      kind: 'REGISTRATION',
      razorpayOrderId: row.razorpayOrderId,
      merchantOrderId: row.razorpayOrderId,
      status: row.status,
      paymentStatus,
      amount: Number(row.amount),
      partnerName: row.details.name,
      partner,
      orderId: row.orderId ? Number(row.orderId) : undefined,
      failureReason: row.failureReason ?? undefined,
    };
  }
}

