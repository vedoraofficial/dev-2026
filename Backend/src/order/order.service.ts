import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Order, PaymentMethod, PaymentStatus, OrderStatus } from './entity/order.entity';
import { CommissionDistribution } from './entity/commission-distribution.entity';
import { Product, ProductStatus } from '../product/entity/product.entity';
import { User, UserStatus } from '../user/entity/user.entity';
import { CommissionUpline } from '../genealogy/entity/commission-upline.entity';
import { GenealogyNode } from '../genealogy/entity/genealogy-node.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionCategory } from '../wallet/entity/wallet-transaction.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminCreateCashOrderDto } from './dto/admin-create-cash-order.dto';

/** Commission structure: level → { rate (basis points), category, flat amount in paise or null } */
const COMMISSION_CONFIG = [
  { level: 0, category: TransactionCategory.COMMISSION_DIRECT, rateBp: 0, flatPaise: 20000 }, // ₹200 flat
  { level: 1, category: TransactionCategory.COMMISSION_LEVEL_1, rateBp: 1000, flatPaise: null }, // 10%
  { level: 2, category: TransactionCategory.COMMISSION_LEVEL_2, rateBp: 1000, flatPaise: null }, // 10%
  { level: 3, category: TransactionCategory.COMMISSION_LEVEL_3, rateBp: 1000, flatPaise: null }, // 10%
  { level: 4, category: TransactionCategory.COMMISSION_LEVEL_4, rateBp: 500, flatPaise: null },  // 5%
  { level: 5, category: TransactionCategory.COMMISSION_LEVEL_5, rateBp: 500, flatPaise: null },  // 5%
];

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(CommissionDistribution)
    private readonly commissionRepo: Repository<CommissionDistribution>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CommissionUpline)
    private readonly uplineRepo: Repository<CommissionUpline>,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Create Order (Partner) ─────────────────────────────────────────
  async createOrder(userId: number, dto: CreateOrderDto) {
    // Validate product
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found.');
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Product is currently inactive.');
    }

    const quantity = dto.quantity || 1;
    const unitPrice = Number(product.salePrice);
    const totalAmount = unitPrice * quantity;
    const bvTotal = Number(product.bvAmount) * quantity;

    // Create order record
    const order = this.orderRepo.create({
      userId,
      productId: product.id,
      quantity,
      unitPrice,
      totalAmount,
      bvTotal,
      paymentMethod: dto.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
    });

    await this.orderRepo.save(order);

    // In-app Notification: ORDER_AWAITING_PAYMENT
    const formattedAmount = `₹${(totalAmount / 100).toFixed(2)}`;
    await this.notificationService.create(
      userId,
      NotificationKey.ORDER_AWAITING_PAYMENT,
      `Complete payment for #${order.id}`,
      `${product.name} × ${quantity} · ${formattedAmount}. Pay with PhonePe from My Orders.`,
      { orderId: Number(order.id), amountPaise: totalAmount },
    );

    // For CASH orders, mark as paid immediately and distribute commissions
    if (dto.paymentMethod === PaymentMethod.CASH) {
      throw new BadRequestException('Cash orders can only be created by an Admin.');
    }

    // For PHONEPE, the PhonePe payment flow will be handled by PaymentService
    // Return order details so the caller can initiate payment
    return {
      message: 'Order created. Proceed with payment.',
      order: {
        id: Number(order.id),
        productName: product.name,
        quantity,
        unitPrice,
        totalAmount,
        totalAmountFormatted: `₹${(totalAmount / 100).toFixed(2)}`,
        bvTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      },
    };
  }

  // ─── Admin: Create Cash Order ───────────────────────────────────────
  async createCashOrder(adminUserId: number, dto: AdminCreateCashOrderDto) {
    // Validate user exists
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found.');

    // Validate product
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found.');
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Product is currently inactive.');
    }

    const quantity = dto.quantity || 1;
    const unitPrice = Number(product.salePrice);
    const totalAmount = unitPrice * quantity;
    const bvTotal = Number(product.bvAmount) * quantity;

    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);

      const order = orderRepo.create({
        userId: dto.userId,
        productId: product.id,
        quantity,
        unitPrice,
        totalAmount,
        bvTotal,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.CONFIRMED,
        createdByAdminId: adminUserId,
      });
      await orderRepo.save(order);

      // Distribute commissions immediately for cash orders
      await this.distributeCommissions(Number(order.id), manager);

      // In-app Notification: CASH_ORDER_RECORDED
      const cashFormattedAmount = `₹${(totalAmount / 100).toFixed(2)}`;
      await this.notificationService.create(
        dto.userId,
        NotificationKey.CASH_ORDER_RECORDED,
        `Cash order #${order.id} recorded`,
        `VEDORA recorded your cash payment of ${cashFormattedAmount} for ${product.name}. Order confirmed.`,
        { orderId: Number(order.id), amountPaise: totalAmount },
        manager,
      );

      return {
        message: 'Cash order created and commissions distributed.',
        order: {
          id: Number(order.id),
          userId: dto.userId,
          userVedId: user.vedId,
          userName: user.name,
          productName: product.name,
          quantity,
          totalAmountFormatted: `₹${(totalAmount / 100).toFixed(2)}`,
          bvTotal,
          paymentMethod: PaymentMethod.CASH,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.CONFIRMED,
        },
      };
    });
  }

  // ─── Commission Distribution ────────────────────────────────────────
  /**
   * Distribute commissions to upline partners based on the VEDORA compensation plan.
   * Must be called INSIDE a database transaction.
   */
  async distributeCommissions(orderId: number, manager: EntityManager): Promise<void> {
    const orderRepo = manager.getRepository(Order);
    const commissionRepo = manager.getRepository(CommissionDistribution);

    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');

    if (order.commissionsDistributed) {
      this.logger.warn(`Commissions already distributed for order #${orderId}. Skipping.`);
      return;
    }

    // Get buyer's commission uplines
    const upline = await manager.getRepository(CommissionUpline).findOne({
      where: { userId: order.userId },
    });

    if (!upline) {
      this.logger.warn(`No commission upline found for user ${order.userId}. Skipping commission distribution.`);
      order.commissionsDistributed = true;
      await orderRepo.save(order);
      return;
    }

    // Map level → upline user ID
    const uplineMap: Record<number, number | null> = {
      1: upline.level1UserId,
      2: upline.level2UserId,
      3: upline.level3UserId,
      4: upline.level4UserId,
      5: upline.level5UserId,
    };

    // Who enrolled the buyer (earns the direct bonus); BV levels above follow the tree (uplineMap)
    const buyerNode = await manager.getRepository(GenealogyNode).findOne({
      where: { userId: order.userId },
    });
    const sponsorUserId = buyerNode?.sponsorUserId ?? null;

    // Get buyer info for notifications
    const buyer = await manager.getRepository(User).findOne({ where: { id: order.userId } });
    const buyerName = buyer?.name || 'Partner';

    const earnedByBeneficiary = new Map<number, { items: string[]; totalPaise: number }>();
    const missedByBeneficiary = new Map<number, { totalPaise: number; status: string }>();

    const bvTotalPaise = Number(order.bvTotal) * 100; // BV → paise (1 BV = ₹1 = 100 paise)

    for (const config of COMMISSION_CONFIG) {
      let beneficiaryUserId: number | null = null;

      if (config.level === 0) {
        // Direct referral bonus goes to the sponsor who enrolled the buyer. That is usually the
        // tree parent (level 1), but differs when the sponsor placed the buyer under a team member.
        beneficiaryUserId = sponsorUserId ?? uplineMap[1];
      } else {
        beneficiaryUserId = uplineMap[config.level];
      }

      if (!beneficiaryUserId) continue;

      // Check if beneficiary is ACTIVE
      const beneficiary = await manager.getRepository(User).findOne({
        where: { id: beneficiaryUserId },
      });

      // Calculate commission amount
      let commissionAmount: number;
      if (config.flatPaise !== null) {
        commissionAmount = config.flatPaise; // ₹200 flat = 20000 paise
      } else {
        commissionAmount = Math.floor((bvTotalPaise * config.rateBp) / 10000); // rateBp / 10000
      }

      if (commissionAmount <= 0) continue;

      if (!beneficiary || beneficiary.status !== UserStatus.ACTIVE) {
        this.logger.log(
          `Skipping level ${config.level} commission for user ${beneficiaryUserId} (status: ${beneficiary?.status || 'NOT_FOUND'})`,
        );
        if (beneficiary) {
          const prev = missedByBeneficiary.get(beneficiaryUserId) || { totalPaise: 0, status: beneficiary.status };
          prev.totalPaise += commissionAmount;
          missedByBeneficiary.set(beneficiaryUserId, prev);
        }
        continue;
      }

      // Credit the beneficiary's wallet
      const walletTxn = await this.walletService.credit(
        beneficiaryUserId,
        commissionAmount,
        config.category,
        `Level ${config.level} commission from order #${orderId}${config.level === 0 ? ' (Direct Referral Bonus ₹200)' : ''}`,
        'ORDER',
        String(orderId),
        manager,
      );

      // Record commission distribution
      const distribution = commissionRepo.create({
        orderId,
        beneficiaryUserId,
        level: config.level,
        commissionRate: config.rateBp,
        amount: commissionAmount,
        walletTransactionId: walletTxn ? Number(walletTxn.id) : null,
      });
      await commissionRepo.save(distribution);

      // Accumulate for single notification per earner
      const label = config.level === 0 ? 'Direct ₹200' : `Level ${config.level} ₹${(commissionAmount / 100).toFixed(0)}`;
      const earned = earnedByBeneficiary.get(beneficiaryUserId) || { items: [], totalPaise: 0 };
      earned.items.push(label);
      earned.totalPaise += commissionAmount;
      earnedByBeneficiary.set(beneficiaryUserId, earned);
    }

    // Mark order as commissions distributed
    order.commissionsDistributed = true;
    await orderRepo.save(order);

    // In-app Notification: COMMISSION_CREDITED (single aggregated notification per earner)
    for (const [beneficiaryUserId, earned] of earnedByBeneficiary.entries()) {
      const totalFormatted = `₹${(earned.totalPaise / 100).toFixed(0)}`;
      const breakdown = earned.items.join(' + ');
      const walletSummary = await this.walletService.getWalletSummary(beneficiaryUserId);
      const balanceFormatted = walletSummary.availableBalanceFormatted;

      await this.notificationService.create(
        beneficiaryUserId,
        NotificationKey.COMMISSION_CREDITED,
        `${totalFormatted} commission credited`,
        `From ${buyerName}'s order #${orderId} · ${breakdown}. Wallet balance: ${balanceFormatted}.`,
        { orderId, totalPaise: earned.totalPaise, breakdown },
        manager,
      );
    }

    // In-app Notification: COMMISSION_MISSED_INACTIVE (to skipped inactive uplines)
    for (const [beneficiaryUserId, missed] of missedByBeneficiary.entries()) {
      const missedFormatted = `₹${(missed.totalPaise / 100).toFixed(2)}`;
      await this.notificationService.create(
        beneficiaryUserId,
        NotificationKey.COMMISSION_MISSED_INACTIVE,
        `You missed ${missedFormatted} in commission`,
        `${buyerName} placed order #${orderId}, but your ID is ${missed.status}, so ${missedFormatted} was not credited. Activate your ID to keep earning.`,
        { orderId, missedPaise: missed.totalPaise, status: missed.status },
        manager,
      );
    }

    this.logger.log(`Commissions distributed for order #${orderId}`);
  }

  // ─── Confirm Payment (called by PaymentService) ─────────────────────
  async confirmOrderPayment(
    orderId: number,
    phonepeTransactionId?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({ where: { id: orderId } });

      if (!order) throw new NotFoundException('Order not found.');
      if (order.paymentStatus === PaymentStatus.PAID) {
        this.logger.warn(`Order #${orderId} already paid. Skipping.`);
        return;
      }

      order.paymentStatus = PaymentStatus.PAID;
      order.orderStatus = OrderStatus.CONFIRMED;
      if (phonepeTransactionId) {
        order.phonepeTransactionId = phonepeTransactionId;
      }
      await orderRepo.save(order);

      // Distribute commissions
      await this.distributeCommissions(Number(order.id), manager);

      // In-app Notification: PAYMENT_SUCCESS (to buyer)
      const product = await manager.getRepository(Product).findOne({ where: { id: order.productId } });
      const productName = product ? product.name : 'Product';
      const formattedAmount = `₹${(Number(order.totalAmount) / 100).toFixed(2)}`;
      await this.notificationService.create(
        order.userId,
        NotificationKey.PAYMENT_SUCCESS,
        `Payment received — #${order.id} confirmed`,
        `We received ${formattedAmount} for ${productName} × ${order.quantity} (${order.bvTotal} BV). Ships in 24–48 business hours.`,
        { orderId: Number(order.id), phonepeTransactionId },
        manager,
      );
    });
  }

  // ─── Fail Payment ───────────────────────────────────────────────────
  async failOrderPayment(orderId: number): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');

    if (order.paymentStatus !== PaymentStatus.PENDING) return;

    order.paymentStatus = PaymentStatus.FAILED;
    order.orderStatus = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);

    // In-app Notification: PAYMENT_FAILED (to buyer)
    const formattedAmount = `₹${(Number(order.totalAmount) / 100).toFixed(2)}`;
    await this.notificationService.create(
      order.userId,
      NotificationKey.PAYMENT_FAILED,
      `Payment failed for #${order.id}`,
      `Your payment of ${formattedAmount} didn't go through. Nothing was charged. Retry from My Orders.`,
      { orderId: Number(order.id) },
    );
  }

  // ─── Get Orders ─────────────────────────────────────────────────────

  async getMyOrders(userId: number) {
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });

    return orders.map((o) => ({
      id: Number(o.id),
      product: {
        id: Number(o.product.id),
        name: o.product.name,
      },
      quantity: o.quantity,
      totalAmount: Number(o.totalAmount),
      totalAmountFormatted: `₹${(Number(o.totalAmount) / 100).toFixed(2)}`,
      bvTotal: Number(o.bvTotal),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
    }));
  }

  async getOrderById(orderId: number, userId?: number) {
    const where: any = { id: orderId };
    if (userId) where.userId = userId;

    const order = await this.orderRepo.findOne({
      where,
      relations: { product: true, user: true },
    });

    if (!order) throw new NotFoundException('Order not found.');

    const commissions = await this.commissionRepo.find({
      where: { orderId },
      relations: { beneficiaryUser: true },
      order: { level: 'ASC' },
    });

    return {
      id: Number(order.id),
      user: {
        id: order.user.id,
        vedId: order.user.vedId,
        name: order.user.name,
      },
      product: {
        id: Number(order.product.id),
        name: order.product.name,
        description: order.product.description,
      },
      quantity: order.quantity,
      unitPrice: Number(order.unitPrice),
      totalAmount: Number(order.totalAmount),
      totalAmountFormatted: `₹${(Number(order.totalAmount) / 100).toFixed(2)}`,
      bvTotal: Number(order.bvTotal),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      phonepeMerchantOrderId: order.phonepeMerchantOrderId,
      commissionsDistributed: order.commissionsDistributed,
      commissions: commissions.map((c) => ({
        level: c.level,
        beneficiary: {
          id: c.beneficiaryUser.id,
          vedId: c.beneficiaryUser.vedId,
          name: c.beneficiaryUser.name,
        },
        commissionRate: c.level === 0 ? '₹200 flat' : `${c.commissionRate / 100}%`,
        amount: Number(c.amount),
        amountFormatted: `₹${(Number(c.amount) / 100).toFixed(2)}`,
      })),
      createdAt: order.createdAt,
    };
  }

  /** Admin: Get all orders */
  async getAllOrders() {
    const orders = await this.orderRepo.find({
      relations: { product: true, user: true },
      order: { createdAt: 'DESC' },
    });

    return orders.map((o) => ({
      id: Number(o.id),
      user: {
        id: o.user.id,
        vedId: o.user.vedId,
        name: o.user.name,
      },
      product: {
        id: Number(o.product.id),
        name: o.product.name,
      },
      quantity: o.quantity,
      totalAmount: Number(o.totalAmount),
      totalAmountFormatted: `₹${(Number(o.totalAmount) / 100).toFixed(2)}`,
      bvTotal: Number(o.bvTotal),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      commissionsDistributed: o.commissionsDistributed,
      createdAt: o.createdAt,
    }));
  }
}
