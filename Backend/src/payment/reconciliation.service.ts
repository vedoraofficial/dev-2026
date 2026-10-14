import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order, PaymentMethod, PaymentStatus } from '../order/entity/order.entity';
import { WalletTopup, WalletTopupStatus } from '../wallet/entity/wallet-topup.entity';
import { PaymentAttempt, PaymentAttemptStatus } from './entity/payment-attempt.entity';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(WalletTopup)
    private readonly topupRepo: Repository<WalletTopup>,
    @InjectRepository(PaymentAttempt)
    private readonly attemptRepo: Repository<PaymentAttempt>,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Reconcile pending payments for orders and top-ups that were initiated
   * but never received a callback/webhook.
   */
  async reconcilePendingPayments(olderThanMinutes: number = 10) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    this.logger.log(`Starting payment reconciliation for items created before ${cutoff.toISOString()}`);

    let processedOrders = 0;
    let processedTopups = 0;
    const errors: string[] = [];

    // 1. Reconcile pending PhonePe orders via direct order merchant ID
    const pendingOrders = await this.orderRepo.find({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.PHONEPE,
        createdAt: LessThan(cutoff),
      },
      take: 50,
    });

    const checkedMerchantOrderIds = new Set<string>();

    for (const order of pendingOrders) {
      if (!order.phonepeMerchantOrderId) continue;
      checkedMerchantOrderIds.add(order.phonepeMerchantOrderId);
      try {
        await this.paymentService.checkAndProcessPayment(
          order.phonepeMerchantOrderId,
          'RECONCILIATION',
        );
        processedOrders++;
      } catch (err: any) {
        this.logger.warn(`Failed reconciling order #${order.id}: ${err.message}`);
        errors.push(`Order #${order.id}: ${err.message}`);
      }
    }

    // 1b. Reconcile stale payment attempts (catches multi-attempt retries where an earlier attempt succeeded)
    const staleAttempts = await this.attemptRepo.find({
      where: {
        status: PaymentAttemptStatus.INITIATED,
        createdAt: LessThan(cutoff),
      },
      take: 50,
    });

    for (const attempt of staleAttempts) {
      if (checkedMerchantOrderIds.has(attempt.merchantOrderId)) continue;
      checkedMerchantOrderIds.add(attempt.merchantOrderId);
      try {
        await this.paymentService.checkAndProcessPayment(
          attempt.merchantOrderId,
          'RECONCILIATION',
        );
        processedOrders++;
      } catch (err: any) {
        this.logger.warn(`Failed reconciling attempt ${attempt.merchantOrderId}: ${err.message}`);
        errors.push(`Attempt ${attempt.merchantOrderId}: ${err.message}`);
      }
    }

    // 2. Reconcile pending wallet top-ups
    const pendingTopups = await this.topupRepo.find({
      where: {
        status: WalletTopupStatus.PENDING,
        createdAt: LessThan(cutoff),
      },
      take: 50,
    });

    for (const topup of pendingTopups) {
      if (!topup.phonepeMerchantOrderId) continue;
      try {
        await this.paymentService.checkAndProcessPayment(
          topup.phonepeMerchantOrderId,
          'RECONCILIATION',
        );
        processedTopups++;
      } catch (err: any) {
        this.logger.warn(`Failed reconciling top-up #${topup.id}: ${err.message}`);
        errors.push(`Top-up #${topup.id}: ${err.message}`);
      }
    }

    this.logger.log(
      `Reconciliation complete: ${processedOrders} orders, ${processedTopups} top-ups processed.`,
    );

    return {
      processedOrders,
      processedTopups,
      pendingOrdersFound: pendingOrders.length,
      pendingTopupsFound: pendingTopups.length,
      errors,
    };
  }
}
