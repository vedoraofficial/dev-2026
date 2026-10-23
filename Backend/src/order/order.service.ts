import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Order, PaymentMethod, PaymentStatus, OrderStatus } from './entity/order.entity';
import { CommissionDistribution } from './entity/commission-distribution.entity';
import { Product, ProductStatus } from '../product/entity/product.entity';
import { User, UserRole, UserStatus } from '../user/entity/user.entity';
import { CommissionUpline } from '../genealogy/entity/commission-upline.entity';
import { GenealogyNode } from '../genealogy/entity/genealogy-node.entity';
import { getAvailableStock } from '../stock/stock-levels';
import { OrderRefund, OrderRefundStatus } from './entity/order-refund.entity';
import { StockMovement, StockMovementType } from '../stock/entity/stock-movement.entity';
import { Wallet } from '../wallet/entity/wallet.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransaction, TransactionType, TransactionCategory } from '../wallet/entity/wallet-transaction.entity';
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
    @InjectRepository(OrderRefund)
    private readonly refundRepo: Repository<OrderRefund>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @Inject(forwardRef(() => WalletService))
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

    // Only what Admin added under Stock can be ordered (no stock entries = out of stock).
    const inStock = await getAvailableStock(this.productRepo.manager, Number(product.id));
    if (inStock < quantity) {
      throw new BadRequestException(
        inStock <= 0 ? 'This product is out of stock.' : `Only ${inStock} left in stock.`,
      );
    }
    const unitPrice = Number(product.salePrice);
    const totalAmount = unitPrice * quantity;
    const bvTotal = Number(product.bvAmount) * quantity;

    // For CASH orders, only admin can create
    if (dto.paymentMethod === PaymentMethod.CASH) {
      throw new BadRequestException('Cash orders can only be created by an Admin.');
    }

    // For WALLET purchases, atomically debit wallet, record stock OUT, and distribute commissions
    if (dto.paymentMethod === PaymentMethod.WALLET) {
      return this.dataSource.transaction(async (manager) => {
        // Re-verify stock inside transaction
        const inStockInTx = await getAvailableStock(manager, Number(product.id));
        if (inStockInTx < quantity) {
          throw new BadRequestException(
            inStockInTx <= 0 ? 'This product is out of stock.' : `Only ${inStockInTx} left in stock.`,
          );
        }

        // Debit buyer's wallet (locks row and validates sufficient balance)
        const walletTxn = await this.walletService.debit(
          userId,
          totalAmount,
          TransactionCategory.ORDER_PAYMENT,
          `Purchase: ${product.name} × ${quantity} (Order payment)`,
          'ORDER',
          undefined,
          manager,
        );

        const orderRepo = manager.getRepository(Order);
        const order = orderRepo.create({
          userId,
          productId: product.id,
          quantity,
          unitPrice,
          totalAmount,
          bvTotal,
          paymentMethod: PaymentMethod.WALLET,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.CONFIRMED,
        });

        const savedOrder = await orderRepo.save(order);

        // Update referenceId on the wallet transaction
        if (walletTxn) {
          await manager.getRepository(WalletTransaction).update(walletTxn.id, {
            referenceId: String(savedOrder.id),
          });
        }

        // Record stock movement OUT
        await manager.getRepository(StockMovement).save(
          manager.getRepository(StockMovement).create({
            productId: Number(product.id),
            type: StockMovementType.OUT,
            quantity,
            note: `Wallet order #${savedOrder.id}`,
            createdBy: userId,
          }),
        );

        // Distribute upline commissions
        await this.distributeCommissions(Number(savedOrder.id), manager);

        // In-app Notification: PAYMENT_SUCCESS
        const formattedAmount = `₹${(totalAmount / 100).toFixed(2)}`;
        await this.notificationService.create(
          userId,
          NotificationKey.PAYMENT_SUCCESS,
          `Order #${savedOrder.id} confirmed`,
          `Paid ${formattedAmount} via wallet for ${product.name} × ${quantity}.`,
          { orderId: Number(savedOrder.id), amountPaise: totalAmount },
          manager,
        );

        return {
          message: 'Order placed and paid successfully using wallet balance.',
          order: {
            id: Number(savedOrder.id),
            productName: product.name,
            quantity,
            unitPrice,
            totalAmount,
            totalAmountFormatted: formattedAmount,
            bvTotal,
            paymentMethod: savedOrder.paymentMethod,
            paymentStatus: savedOrder.paymentStatus,
            orderStatus: savedOrder.orderStatus,
            createdAt: savedOrder.createdAt,
          },
        };
      });
    }

    // For RAZORPAY, create pending order and return details so caller can initiate payment
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
      `${product.name} × ${quantity} · ${formattedAmount}. Pay online via Razorpay from My Orders.`,
      { orderId: Number(order.id), amountPaise: totalAmount },
    );

    // For RAZORPAY, the Razorpay payment flow will be handled by PaymentService
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

    // Only what Admin added under Stock can be ordered (no stock entries = out of stock).
    const inStock = await getAvailableStock(this.productRepo.manager, Number(product.id));
    if (inStock < quantity) {
      throw new BadRequestException(
        inStock <= 0 ? 'This product is out of stock.' : `Only ${inStock} left in stock.`,
      );
    }
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

      // Record stock movement OUT for cash purchase
      await manager.getRepository(StockMovement).save(
        manager.getRepository(StockMovement).create({
          productId: Number(product.id),
          type: StockMovementType.OUT,
          quantity,
          note: `Cash order #${order.id}`,
          createdBy: adminUserId,
        }),
      );

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
  /**
   * Saves a level-0 commission row. commission_distributions is unique on (order, level, person),
   * and the sponsor's direct bonus, the Admin commission and the buyer's BV credit are all level 0 —
   * so when they land on the same person (e.g. VED108 is also the sponsor) the amount is added to
   * the existing row instead of failing the whole order. Each wallet credit stays its own entry.
   */
  private async recordLevelZeroDistribution(
    commissionRepo: Repository<CommissionDistribution>,
    row: {
      orderId: number;
      beneficiaryUserId: number;
      commissionRate: number;
      amount: number;
      walletTransactionId: number | null;
    },
  ): Promise<void> {
    const existing = await commissionRepo.findOne({
      where: { orderId: row.orderId, level: 0, beneficiaryUserId: row.beneficiaryUserId },
    });
    if (existing) {
      existing.amount = Number(existing.amount) + row.amount;
      await commissionRepo.save(existing);
      return;
    }
    await commissionRepo.save(commissionRepo.create({ ...row, level: 0 }));
  }

  async distributeCommissions(orderId: number, manager: EntityManager): Promise<void> {
    const orderRepo = manager.getRepository(Order);
    const commissionRepo = manager.getRepository(CommissionDistribution);

    const order = await orderRepo.findOne({
      where: { id: orderId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!order) throw new NotFoundException('Order not found.');

    if (order.commissionsDistributed) {
      this.logger.warn(`Commissions already distributed for order #${orderId}. Skipping.`);
      return;
    }

    const existingCount = await commissionRepo.count({ where: { orderId } });
    if (existingCount > 0) {
      this.logger.warn(`Commission distribution records already exist for order #${orderId}. Marking order and skipping.`);
      order.commissionsDistributed = true;
      await orderRepo.save(order);
      return;
    }

    // Get buyer's commission uplines
    const upline = await manager.getRepository(CommissionUpline).findOne({
      where: { userId: order.userId },
    });

    // No upline row (e.g. Founders, who sit at the top of the tree): no sponsor / level
    // commissions, but the Admin commission and the buyer's BV credit below still apply.
    if (!upline) {
      this.logger.warn(`No commission upline found for user ${order.userId}. Skipping upline commissions only.`);
    }

    // Map level → upline user ID
    const uplineMap: Record<number, number | null> = {
      1: upline?.level1UserId ?? null,
      2: upline?.level2UserId ?? null,
      3: upline?.level3UserId ?? null,
      4: upline?.level4UserId ?? null,
      5: upline?.level5UserId ?? null,
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

    for (const config of upline ? COMMISSION_CONFIG : []) {
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

    // ─── Task 3: Admin Direct Commission (₹200 per product unit sold) ───
    const rootAdmin =
      (await manager.getRepository(User).findOne({ where: { vedId: 'VED108' } })) ??
      (await manager.getRepository(User).findOne({ where: { role: UserRole.ADMIN } }));
    if (rootAdmin) {
      await this.walletService.createWallet(rootAdmin.id, manager);
      const units = Math.max(1, Number(order.quantity) || 1);
      const adminCommissionPaise = 20000 * units; // ₹200 (20,000 paise) per unit
      const adminTxn = await this.walletService.credit(
        rootAdmin.id,
        adminCommissionPaise,
        TransactionCategory.COMMISSION_DIRECT,
        `Admin direct commission for product purchase - Order #${orderId} (₹200 × ${units})`,
        'ORDER',
        String(orderId),
        manager,
      );

      await this.recordLevelZeroDistribution(commissionRepo, {
        orderId,
        beneficiaryUserId: rootAdmin.id,
        commissionRate: 0,
        amount: adminCommissionPaise,
        walletTransactionId: adminTxn ? Number(adminTxn.id) : null,
      });

      await this.notificationService.create(
        rootAdmin.id,
        NotificationKey.COMMISSION_CREDITED,
        `₹${adminCommissionPaise / 100} Admin commission credited`,
        `Direct commission of ₹${adminCommissionPaise / 100} (₹200 × ${units}) credited to Admin wallet for Order #${orderId}.`,
        { orderId, units, totalPaise: adminCommissionPaise },
        manager,
      );
    }

    // ─── Task 5: 1 BV = ₹1 credited to purchasing user's wallet ────────────
    const bvTotalNum = Number(order.bvTotal);
    if (bvTotalNum > 0) {
      const bvPaise = bvTotalNum * 100; // 1 BV = 100 paise (₹1)
      const bvTxn = await this.walletService.credit(
        order.userId,
        bvPaise,
        TransactionCategory.COMMISSION_LEVEL_1,
        `BV Earnings: ${bvTotalNum} BV credited as ₹${bvTotalNum} for Order #${orderId}`,
        'ORDER',
        String(orderId),
        manager,
      );

      await this.recordLevelZeroDistribution(commissionRepo, {
        orderId,
        beneficiaryUserId: order.userId,
        commissionRate: 10000, // 100% (1 BV = ₹1)
        amount: bvPaise,
        walletTransactionId: bvTxn ? Number(bvTxn.id) : null,
      });

      await this.notificationService.create(
        order.userId,
        NotificationKey.COMMISSION_CREDITED,
        `₹${bvTotalNum} BV earnings credited`,
        `Your order #${orderId} generated ${bvTotalNum} BV, credited as ₹${bvTotalNum} to your wallet.`,
        { orderId: Number(order.id), totalPaise: bvPaise, bv: bvTotalNum },
        manager,
      );
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
    razorpayPaymentId?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) throw new NotFoundException('Order not found.');
      if (order.paymentStatus === PaymentStatus.PAID) {
        this.logger.warn(`Order #${orderId} already paid. Skipping.`);
        return;
      }

      if (razorpayPaymentId) {
        order.razorpayPaymentId = razorpayPaymentId;
      }

      // Re-verify stock inside transaction to prevent oversell race condition
      const inStock = await getAvailableStock(manager, Number(order.productId));
      if (inStock < order.quantity) {
        this.logger.error(
          `Oversell detected: Order #${orderId} (Product #${order.productId}) paid via Razorpay, but only ${inStock} items in stock (ordered: ${order.quantity}).`,
        );
        order.paymentStatus = PaymentStatus.PAID;
        order.orderStatus = OrderStatus.CANCELLED;
        await orderRepo.save(order);

        // Notify admins immediately of the oversold order
        await this.notificationService.notifyAllAdmins(
          NotificationKey.ADMIN_ORDER_CANCELLED,
          `Oversell alert: Order #${order.id} cancelled`,
          `Order #${order.id} was paid via Razorpay (${razorpayPaymentId || 'TXN'}) but product is out of stock. Automatic refund credited to wallet.`,
          { orderId: Number(order.id), productId: Number(order.productId), quantity: order.quantity },
          manager,
        );

        // Refund buyer directly to their wallet so their funds are immediately returned
        await this.walletService.credit(
          order.userId,
          Number(order.totalAmount),
          TransactionCategory.REFUND,
          `Automatic refund for out-of-stock order #${order.id}`,
          'ORDER',
          String(order.id),
          manager,
        );

        return;
      }

      order.paymentStatus = PaymentStatus.PAID;
      order.orderStatus = OrderStatus.CONFIRMED;
      await orderRepo.save(order);

      // Record stock movement OUT for paid Razorpay order
      await manager.getRepository(StockMovement).save(
        manager.getRepository(StockMovement).create({
          productId: Number(order.productId),
          type: StockMovementType.OUT,
          quantity: order.quantity,
          note: `Razorpay order #${order.id} confirmed`,
          createdBy: order.userId,
        }),
      );

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
        { orderId: Number(order.id), razorpayPaymentId },
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
      product: o.product
        ? {
            id: Number(o.product.id),
            name: o.product.name,
          }
        : null,
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
      user: order.user
        ? {
            id: order.user.id,
            vedId: order.user.vedId,
            name: order.user.name,
          }
        : null,
      product: order.product
        ? {
            id: Number(order.product.id),
            name: order.product.name,
            description: order.product.description,
          }
        : null,
      quantity: order.quantity,
      unitPrice: Number(order.unitPrice),
      totalAmount: Number(order.totalAmount),
      totalAmountFormatted: `₹${(Number(order.totalAmount) / 100).toFixed(2)}`,
      bvTotal: Number(order.bvTotal),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      razorpayOrderId: order.razorpayOrderId,
      commissionsDistributed: order.commissionsDistributed,
      commissions: commissions.map((c) => ({
        level: c.level,
        beneficiary: c.beneficiaryUser
          ? {
              id: c.beneficiaryUser.id,
              vedId: c.beneficiaryUser.vedId,
              name: c.beneficiaryUser.name,
            }
          : null,
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
      user: o.user
        ? {
            id: o.user.id,
            vedId: o.user.vedId,
            name: o.user.name,
          }
        : null,
      product: o.product
        ? {
            id: Number(o.product.id),
            name: o.product.name,
          }
        : null,
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

  // ─── Cancel and Refund Order ────────────────────────────────────────
  async cancelAndRefundOrder(
    orderId: number,
    requestingUserId: number,
    isAdmin: boolean = false,
    reason?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const refundRepo = manager.getRepository(OrderRefund);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: { product: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) throw new NotFoundException('Order not found.');

      if (!isAdmin && order.userId !== requestingUserId) {
        throw new BadRequestException('You do not have permission to cancel this order.');
      }

      if (order.orderStatus === OrderStatus.CANCELLED) {
        throw new BadRequestException('Order is already cancelled.');
      }

      // If pending (unpaid), cancel without financial refund
      if (order.paymentStatus === PaymentStatus.PENDING) {
        order.orderStatus = OrderStatus.CANCELLED;
        order.paymentStatus = PaymentStatus.FAILED;
        await orderRepo.save(order);
        return { message: 'Pending order cancelled.', orderId: Number(order.id) };
      }

      // Paid and confirmed orders require administrator review
      if (!isAdmin) {
        throw new BadRequestException(
          'Paid and confirmed orders cannot be cancelled directly by customers. Please contact support or an administrator for cancellation and refunds.',
        );
      }

      if (order.paymentStatus !== PaymentStatus.PAID) {
        throw new BadRequestException(`Cannot refund order with payment status: ${order.paymentStatus}`);
      }

      // Check if refund already processed
      const existingRefund = await refundRepo.findOne({
        where: { orderId: order.id, status: OrderRefundStatus.COMPLETED },
      });
      if (existingRefund) {
        throw new ConflictException('This order has already been refunded.');
      }

      // Claw back / reverse distributed commissions from uplines
      if (order.commissionsDistributed) {
        const distributions = await manager.getRepository(CommissionDistribution).find({
          where: { orderId: order.id },
        });

        for (const dist of distributions) {
          const commAmount = Number(dist.amount);
          if (commAmount > 0) {
            const beneficiaryWallet = await manager.getRepository(Wallet).findOne({
              where: { userId: dist.beneficiaryUserId },
              lock: { mode: 'pessimistic_write' },
            });

            if (beneficiaryWallet) {
              const currentAvailable = Number(beneficiaryWallet.availableBalance);
              const currentEarned = Number(beneficiaryWallet.totalEarned);
              const newAvailable = Math.max(0, currentAvailable - commAmount);
              const newEarned = Math.max(0, currentEarned - commAmount);

              await manager.getRepository(Wallet).update(beneficiaryWallet.id, {
                availableBalance: newAvailable,
                totalEarned: newEarned,
              });

              await manager.getRepository(WalletTransaction).save(
                manager.getRepository(WalletTransaction).create({
                  walletId: beneficiaryWallet.id,
                  type: TransactionType.DEBIT,
                  category: TransactionCategory.ADMIN_DEBIT,
                  amount: commAmount,
                  balanceAfter: newAvailable,
                  referenceType: 'ORDER_COMMISSION_REVERSAL',
                  referenceId: String(order.id),
                  description: `Commission reversal for cancelled order #${order.id}`,
                }),
              );
            }
          }
        }
      }

      let walletTxnId: number | null = null;

      // Refund credited back to user's wallet
      const txn = await this.walletService.credit(
        order.userId,
        Number(order.totalAmount),
        TransactionCategory.REFUND,
        `Refund for cancelled order #${order.id} (${order.product?.name || 'Product'})`,
        'ORDER_REFUND',
        String(order.id),
        manager,
      );
      walletTxnId = txn ? Number(txn.id) : null;

      // Restore product stock
      await manager.getRepository(StockMovement).save(
        manager.getRepository(StockMovement).create({
          productId: Number(order.productId),
          type: StockMovementType.IN,
          quantity: order.quantity,
          note: `Restocked from cancelled order #${order.id}`,
          createdBy: requestingUserId,
        }),
      );

      // Record refund
      const refundRecord = refundRepo.create({
        orderId: Number(order.id),
        refundAmount: Number(order.totalAmount),
        status: OrderRefundStatus.COMPLETED,
        reason: reason || (isAdmin ? 'Cancelled by Admin' : 'Cancelled by customer'),
        walletTransactionId: walletTxnId,
        adminUserId: isAdmin ? requestingUserId : null,
      });
      await refundRepo.save(refundRecord);

      // Update order status
      order.orderStatus = OrderStatus.CANCELLED;
      order.paymentStatus = PaymentStatus.REFUNDED;
      await orderRepo.save(order);

      // In-app Notification to buyer
      const formattedAmount = `₹${(Number(order.totalAmount) / 100).toFixed(2)}`;
      await this.notificationService.create(
        order.userId,
        NotificationKey.PAYMENT_FAILED,
        `Order #${order.id} cancelled & refunded`,
        `Your order of ${formattedAmount} for ${order.product?.name || 'Product'} has been refunded to your wallet balance.`,
        { orderId: Number(order.id), refundAmountPaise: Number(order.totalAmount) },
        manager,
      );

      return {
        message: 'Order cancelled and refunded successfully.',
        orderId: Number(order.id),
        refundAmount: Number(order.totalAmount),
        refundAmountFormatted: formattedAmount,
        paymentStatus: PaymentStatus.REFUNDED,
        orderStatus: OrderStatus.CANCELLED,
      };
    });
  }
}
