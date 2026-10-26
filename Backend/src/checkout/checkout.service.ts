import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../order/entity/order.entity';
import { OrderService } from '../order/order.service';
import { Product, ProductStatus } from '../product/entity/product.entity';
import { getAvailableStock } from '../stock/stock-levels';
import { User } from '../user/entity/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';
import { ExternalPaymentHandler, PaymentRequester, PaymentService } from '../payment/payment.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderCheckout, OrderCheckoutStatus } from './entity/order-checkout.entity';

/** Razorpay receipt prefix of a cart payment */
const CHECKOUT_PREFIX = 'CHK_';

const formatPaise = (paise: number) => `₹${(Number(paise) / 100).toFixed(2)}`;

/**
 * Cart checkout: every product becomes its own order, but the cart is paid once — from the wallet
 * in one transaction, or with one Razorpay payment for the total. Orders paid together share one
 * invoice and one email (see InvoiceService).
 */
@Injectable()
export class CheckoutService implements OnModuleInit, ExternalPaymentHandler {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderCheckout)
    private readonly checkoutRepo: Repository<OrderCheckout>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit() {
    this.paymentService.registerExternalHandler(this);
  }

  async checkout(userId: number, dto: CheckoutDto) {
    const lines = await this.validateCart(dto);
    if (dto.paymentMethod === PaymentMethod.WALLET) return this.payFromWallet(userId, lines);
    return this.startRazorpay(userId, lines);
  }

  /** Same product twice → one line; every product active and in stock. */
  private async validateCart(dto: CheckoutDto) {
    const quantities = new Map<number, number>();
    for (const item of dto.items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }

    const lines: { product: Product; quantity: number }[] = [];
    for (const [productId, quantity] of quantities) {
      const product = await this.productRepo.findOne({ where: { id: productId } });
      if (!product) throw new NotFoundException('Product not found.');
      if (product.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException(`${product.name} is currently inactive.`);
      }
      const inStock = await getAvailableStock(this.productRepo.manager, Number(product.id));
      if (inStock < quantity) {
        throw new BadRequestException(
          inStock <= 0 ? `${product.name} is out of stock.` : `Only ${inStock} of ${product.name} left in stock.`,
        );
      }
      lines.push({ product, quantity });
    }
    return lines;
  }

  // ─── Wallet: one transaction — every order is paid, or none is ───

  private async payFromWallet(userId: number, lines: { product: Product; quantity: number }[]) {
    const placed = await this.dataSource.transaction(async (manager) => {
      const results: Awaited<ReturnType<OrderService['placeWalletOrder']>>[] = [];
      for (const line of lines) {
        results.push(await this.orderService.placeWalletOrder(manager, userId, line.product, line.quantity));
      }
      return results;
    });

    const total = placed.reduce((sum, r) => sum + r.order.totalAmount, 0);
    return {
      status: 'PAID' as const,
      message:
        placed.length > 1
          ? `${placed.length} orders placed and paid from your wallet (${formatPaise(total)}).`
          : 'Order placed and paid successfully using wallet balance.',
      orders: placed.map((r) => r.order),
      totalAmount: total,
    };
  }

  // ─── Razorpay: one payment for the whole cart ───

  private async startRazorpay(userId: number, lines: { product: Product; quantity: number }[]) {
    const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });

    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const orders: Order[] = [];
      for (const { product, quantity } of lines) {
        const unitPrice = Number(product.salePrice);
        orders.push(
          await orderRepo.save(
            orderRepo.create({
              userId,
              productId: product.id,
              quantity,
              unitPrice,
              totalAmount: unitPrice * quantity,
              bvTotal: Number(product.bvAmount) * quantity,
              paymentMethod: PaymentMethod.RAZORPAY,
              paymentStatus: PaymentStatus.PENDING,
              orderStatus: OrderStatus.PENDING,
            }),
          ),
        );
      }
      const amount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const orderIds = orders.map((o) => Number(o.id));

      // If Razorpay can't create the payment, the orders above are rolled back too.
      const checkout = await this.paymentService.createRazorpayCheckout({
        amount,
        receipt: `${CHECKOUT_PREFIX}${userId}_${Date.now().toString().slice(-6)}`,
        description:
          lines.length > 1
            ? `${lines.length} products (orders ${orderIds.map((id) => `#${id}`).join(', ')})`
            : `${lines[0].product.name} × ${lines[0].quantity}`,
        notes: { type: 'CART_CHECKOUT', userId: String(userId), orderIds: orderIds.join(',') },
        prefill: { name: user?.name, email: user?.email ?? undefined, contact: user?.mobile },
      });

      // The orders carry the payment too — "Check payment status" in My Orders and reconciliation find it.
      await orderRepo.update({ id: In(orderIds) }, { razorpayOrderId: checkout.orderId });
      await manager.getRepository(OrderCheckout).save(
        manager.getRepository(OrderCheckout).create({
          userId,
          orderIds,
          amount,
          status: OrderCheckoutStatus.PENDING,
          razorpayOrderId: checkout.orderId,
        }),
      );

      await this.notificationService.create(
        userId,
        NotificationKey.ORDER_AWAITING_PAYMENT,
        `Complete payment for ${orderIds.length > 1 ? `${orderIds.length} orders` : `#${orderIds[0]}`}`,
        `${lines.map((l) => `${l.product.name} × ${l.quantity}`).join(', ')} · ${formatPaise(amount)}. Pay online via Razorpay.`,
        { orderIds, amountPaise: amount },
        manager,
      );
      this.logger.log(`Cart checkout by user #${userId}: orders ${orderIds.join(', ')} → ${checkout.orderId}`);

      return {
        status: 'PAYMENT_REQUIRED' as const,
        message: 'Complete the Razorpay payment to confirm your orders.',
        razorpayOrderId: checkout.orderId,
        checkout,
        amount,
        orderIds,
      };
    });
  }

  // ─── ExternalPaymentHandler (called by PaymentService) ───

  async owns(razorpayOrderId: string): Promise<boolean> {
    return (await this.checkoutRepo.count({ where: { razorpayOrderId } })) > 0;
  }

  /** POST /api/payment/verify: the signature is already checked — confirm every order. */
  async complete(razorpayOrderId: string, razorpayPaymentId: string) {
    const checkout = await this.checkoutRepo.findOne({ where: { razorpayOrderId } });
    if (!checkout) throw new NotFoundException(`Checkout not found for Razorpay order: ${razorpayOrderId}`);
    if (checkout.status === OrderCheckoutStatus.PENDING) {
      await this.confirmPaid(Number(checkout.id), razorpayPaymentId);
    }
    return this.describe(Number(checkout.id));
  }

  /** Status check / webhook / reconciliation. */
  async checkAndProcess(razorpayOrderId: string, _eventType: string, requestingUser?: PaymentRequester) {
    const checkout = await this.checkoutRepo.findOne({ where: { razorpayOrderId } });
    if (!checkout) throw new NotFoundException(`Checkout not found for Razorpay order: ${razorpayOrderId}`);

    if (requestingUser) {
      const requesterId = Number(requestingUser.sub || requestingUser.id);
      if (Number(checkout.userId) !== requesterId && requestingUser.role !== 'ADMIN') {
        throw new ForbiddenException('You do not have permission to check this payment.');
      }
    }

    if (checkout.status === OrderCheckoutStatus.PENDING) {
      const paymentId = await this.paymentService.fetchCapturedPaymentId(razorpayOrderId);
      if (paymentId) await this.confirmPaid(Number(checkout.id), paymentId);
    }
    return this.describe(Number(checkout.id));
  }

  async findStalePending(olderThan: Date): Promise<string[]> {
    const rows = await this.checkoutRepo.find({
      where: { status: OrderCheckoutStatus.PENDING, createdAt: LessThan(olderThan) },
      select: { razorpayOrderId: true },
      take: 50,
    });
    return rows.map((r) => r.razorpayOrderId);
  }

  /**
   * Paid: confirm all the cart's orders in one transaction (one invoice, one email). An order that
   * was meanwhile paid on its own is skipped, and its share of this payment goes back to the buyer.
   */
  private async confirmPaid(checkoutId: number, razorpayPaymentId: string) {
    const refund = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderCheckout);
      const checkout = await repo.findOne({ where: { id: checkoutId }, lock: { mode: 'pessimistic_write' } });
      if (!checkout || checkout.status !== OrderCheckoutStatus.PENDING) return null;

      const orderRepo = manager.getRepository(Order);
      let alreadyPaid = 0;
      for (const orderId of checkout.orderIds) {
        await orderRepo.update(orderId, { razorpayOrderId: checkout.razorpayOrderId });
        const result = await this.orderService.confirmOrderPaymentInTx(manager, orderId, razorpayPaymentId);
        if (result === 'ALREADY_PAID') {
          const order = await orderRepo.findOne({ where: { id: orderId } });
          alreadyPaid += Number(order?.totalAmount ?? 0);
        }
      }

      checkout.status = OrderCheckoutStatus.PAID;
      checkout.razorpayPaymentId = razorpayPaymentId;
      await repo.save(checkout);
      return alreadyPaid > 0 ? { checkout, amount: alreadyPaid } : null;
    });

    if (refund) await this.refundDoublePayment(refund.checkout, refund.amount, razorpayPaymentId);
  }

  /** Never throws — the orders are confirmed; a refund problem goes to Admin. */
  private async refundDoublePayment(checkout: OrderCheckout, amount: number, razorpayPaymentId: string) {
    let note: string;
    try {
      const refund = await this.paymentService.refundPayment({ razorpayPaymentId } as Order, amount);
      note = `Razorpay refund ${refund.refundId} started.`;
      await this.notificationService.create(
        checkout.userId,
        NotificationKey.PAYMENT_SUCCESS,
        `${formatPaise(amount)} refunded`,
        `Some of these orders were already paid separately, so ${formatPaise(amount)} of your Razorpay payment is refunded to your original payment method.`,
        { razorpayOrderId: checkout.razorpayOrderId, refundPaise: amount },
      );
    } catch (error: any) {
      note = `The automatic Razorpay refund failed (${error?.message ?? error}) — refund it from the Razorpay dashboard.`;
      this.logger.error(`Checkout ${checkout.razorpayOrderId}: ${note}`);
    }
    await this.notificationService
      .notifyAllAdmins(
        NotificationKey.ADMIN_ORDER_CANCELLED,
        'Cart payment partly refunded',
        `Cart payment ${checkout.razorpayOrderId} (${razorpayPaymentId}) included orders that were already paid separately. ${formatPaise(amount)} is due back to the buyer. ${note}`,
        { razorpayOrderId: checkout.razorpayOrderId, refundPaise: amount },
      )
      .catch(() => {});
  }

  /** What payment verify / GET /api/payment/status/:razorpayOrderId return for a cart payment. */
  private async describe(checkoutId: number) {
    const checkout = await this.checkoutRepo.findOneOrFail({ where: { id: checkoutId } });
    const paid = checkout.status === OrderCheckoutStatus.PAID;
    return {
      message: paid ? 'Payment received — your orders are confirmed.' : 'Waiting for the Razorpay payment.',
      kind: 'CHECKOUT',
      razorpayOrderId: checkout.razorpayOrderId,
      merchantOrderId: checkout.razorpayOrderId,
      status: paid ? 'COMPLETED' : 'PENDING',
      paymentStatus: paid ? 'PAID' : 'PENDING',
      orderStatus: paid ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
      amount: Number(checkout.amount),
      orderId: checkout.orderIds[0],
      orderIds: checkout.orderIds,
    };
  }
}
