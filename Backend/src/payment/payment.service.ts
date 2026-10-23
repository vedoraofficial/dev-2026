import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
const Razorpay = require('razorpay');

import { Order, PaymentMethod, PaymentStatus } from '../order/entity/order.entity';
import { PaymentEvent } from './entity/payment-event.entity';
import { PaymentAttempt, PaymentAttemptStatus } from './entity/payment-attempt.entity';
import { WalletTopup, WalletTopupStatus } from '../wallet/entity/wallet-topup.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionCategory } from '../wallet/entity/wallet-transaction.entity';
import { OrderService } from '../order/order.service';

export type PaymentRequester = { sub?: number; id?: number; role?: string };

/** What the frontend passes to the Razorpay checkout popup. */
export type RazorpayCheckout = {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
  receipt: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

/**
 * Razorpay payments owned by another module (e.g. partner registrations held until paid).
 * The owning module registers itself, so this service needn't import it.
 */
export interface ExternalPaymentHandler {
  /** True when this Razorpay order id belongs to the handler. */
  owns(razorpayOrderId: string): Promise<boolean>;
  /** The checkout signature is already verified — settle the payment. */
  complete(razorpayOrderId: string, razorpayPaymentId: string): Promise<any>;
  /** Status check, webhook or reconciliation for one of its payments. */
  checkAndProcess(
    razorpayOrderId: string,
    eventType: string,
    requestingUser?: PaymentRequester,
  ): Promise<any>;
  /** Razorpay order ids still pending since before `olderThan` (for reconciliation). */
  findStalePending(olderThan: Date): Promise<string[]>;
}

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private razorpayInstance: any = null;
  private readonly externalHandlers: ExternalPaymentHandler[] = [];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(PaymentEvent)
    private readonly eventRepo: Repository<PaymentEvent>,
    @InjectRepository(PaymentAttempt)
    private readonly attemptRepo: Repository<PaymentAttempt>,
    @InjectRepository(WalletTopup)
    private readonly topupRepo: Repository<WalletTopup>,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {}

  async onModuleInit() {
    this.initializeRazorpayClient();
  }

  private initializeRazorpayClient() {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      this.logger.warn(
        'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env',
      );
      return;
    }

    try {
      this.razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      const env = (this.configService.get<string>('RAZORPAY_ENV') || 'TEST').toUpperCase();
      this.logger.log(`Razorpay client initialized (${env} mode) with Key ID: ${keyId}`);
    } catch (error) {
      this.logger.error('Failed to initialize Razorpay client:', error);
    }
  }

  getKeyId(): string {
    return this.configService.get<string>('RAZORPAY_KEY_ID') || '';
  }

  // ─── Payments owned by other modules ───────────────────────────────

  registerExternalHandler(handler: ExternalPaymentHandler) {
    this.externalHandlers.push(handler);
  }

  getExternalHandlers(): ExternalPaymentHandler[] {
    return [...this.externalHandlers];
  }

  private async findExternalHandler(razorpayOrderId: string) {
    for (const handler of this.externalHandlers) {
      if (await handler.owns(razorpayOrderId)) return handler;
    }
    return null;
  }

  /**
   * Creates a Razorpay order for `amount` paise and returns what the checkout popup needs.
   * Without Razorpay keys (local testing) it returns an `order_test_…` id, like order payments do.
   */
  async createRazorpayCheckout(params: {
    amount: number;
    receipt: string;
    description: string;
    notes?: Record<string, string>;
    prefill?: { name?: string; email?: string; contact?: string };
  }): Promise<RazorpayCheckout> {
    const keyId = this.getKeyId();
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    let razorpayOrderId: string;

    if (this.razorpayInstance && keyId && keySecret) {
      try {
        const rzpOrder = await this.razorpayInstance.orders.create({
          amount: params.amount,
          currency: 'INR',
          receipt: params.receipt,
          notes: params.notes ?? {},
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err: any) {
        const msg = err.error?.description || err.message || 'Authentication or network error';
        this.logger.error(`Razorpay orders.create failed: ${msg}`, err);
        throw new BadRequestException(`Razorpay Error: ${msg}. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.`);
      }
    } else {
      razorpayOrderId = `order_test_${params.receipt}_${Date.now()}`;
    }

    return {
      keyId,
      amount: params.amount,
      currency: 'INR',
      orderId: razorpayOrderId,
      receipt: params.receipt,
      name: 'VEDORA',
      description: params.description,
      prefill: {
        name: params.prefill?.name ?? '',
        email: params.prefill?.email ?? '',
        contact: params.prefill?.contact ?? '',
      },
    };
  }

  /** The captured Razorpay payment id for an order, or null (not paid yet / test order). */
  async fetchCapturedPaymentId(razorpayOrderId: string): Promise<string | null> {
    if (!this.razorpayInstance || razorpayOrderId.startsWith('order_test_')) return null;
    try {
      const payments = await this.razorpayInstance.orders.fetchPayments(razorpayOrderId);
      const captured = payments?.items?.find((p: any) => p.status === 'captured');
      return captured?.id ?? null;
    } catch (err) {
      this.logger.warn(`Failed to fetch Razorpay payments for ${razorpayOrderId}:`, err);
      return null;
    }
  }

  // ─── 1. Initiate Razorpay Payment for an Order ─────────────────────
  async initiatePayment(orderId: number): Promise<{
    keyId: string;
    amount: number;
    currency: string;
    orderId: string;
    receipt: string;
    name: string;
    description: string;
    prefill: { name: string; email: string; contact: string };
  }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { user: true, product: true },
    });
    if (!order) throw new NotFoundException('Order not found.');

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid.');
    }

    const keyId = this.getKeyId();
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    const amount = Number(order.totalAmount); // in paise
    const receipt = `ORD_${order.id}_${Date.now().toString().slice(-6)}`;
    let razorpayOrderId: string;

    if (this.razorpayInstance && keyId && keySecret) {
      try {
        const rzpOrder = await this.razorpayInstance.orders.create({
          amount,
          currency: 'INR',
          receipt,
          notes: {
            orderId: String(order.id),
            userId: String(order.userId),
            productName: order.product?.name || 'Vedora Bracelet',
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err: any) {
        const msg = err.error?.description || err.message || 'Authentication or network error';
        this.logger.error(`Razorpay orders.create failed: ${msg}`, err);
        throw new BadRequestException(`Razorpay Error: ${msg}. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.`);
      }
    } else {
      razorpayOrderId = `order_test_${order.id}_${Date.now()}`;
    }

    // Save active razorpay order id on the order
    order.razorpayOrderId = razorpayOrderId;
    order.paymentMethod = PaymentMethod.RAZORPAY;
    await this.orderRepo.save(order);

    // Record attempt
    const attempt = this.attemptRepo.create({
      orderId: Number(order.id),
      merchantOrderId: razorpayOrderId,
      amount,
      status: PaymentAttemptStatus.INITIATED,
    });
    await this.attemptRepo.save(attempt);

    this.logger.log(`Razorpay payment initiated for order #${orderId}, order_id: ${razorpayOrderId}`);

    return {
      keyId,
      amount,
      currency: 'INR',
      orderId: razorpayOrderId,
      receipt,
      name: 'VEDORA',
      description: `Payment for ${order.product?.name || 'Order #' + order.id}`,
      prefill: {
        name: order.user?.name || '',
        email: order.user?.email || '',
        contact: order.user?.mobile || '',
      },
    };
  }

  // ─── 2. Initiate Wallet Top-up (Add-Money) ─────────────────────────
  async initiateTopup(
    userId: number,
    amount: number,
  ): Promise<{
    keyId: string;
    amount: number;
    currency: string;
    orderId: string;
    receipt: string;
    name: string;
    description: string;
    prefill: { name: string; email: string; contact: string };
  }> {
    if (amount < 10000) {
      throw new BadRequestException('Minimum top-up amount is ₹100 (10,000 paise).');
    }

    const keyId = this.getKeyId();
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    const receipt = `TOPUP_${userId}_${Date.now().toString().slice(-6)}`;
    let razorpayOrderId: string;

    if (this.razorpayInstance && keyId && keySecret) {
      try {
        const rzpOrder = await this.razorpayInstance.orders.create({
          amount,
          currency: 'INR',
          receipt,
          notes: {
            userId: String(userId),
            type: 'WALLET_TOPUP',
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err: any) {
        const msg = err.error?.description || err.message || 'Authentication or network error';
        this.logger.error(`Razorpay topup orders.create failed: ${msg}`, err);
        throw new BadRequestException(`Razorpay Error: ${msg}. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.`);
      }
    } else {
      razorpayOrderId = `order_topup_${userId}_${Date.now()}`;
    }

    const topup = this.topupRepo.create({
      userId,
      amount,
      status: WalletTopupStatus.PENDING,
      razorpayOrderId,
    });
    await this.topupRepo.save(topup);

    this.logger.log(`Razorpay topup initiated for user #${userId}, order_id: ${razorpayOrderId}`);

    return {
      keyId,
      amount,
      currency: 'INR',
      orderId: razorpayOrderId,
      receipt,
      name: 'VEDORA',
      description: `Wallet Balance Top-up (₹${(amount / 100).toFixed(2)})`,
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
    };
  }

  // ─── 3. Verify Payment Signature (Order or Top-up) ──────────────────
  async verifyPayment(dto: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<any> {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = dto;
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    const env = (this.configService.get<string>('RAZORPAY_ENV') || 'TEST').toUpperCase();

    // 1. Signature check
    let isValid = false;
    if (keySecret && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    }

    // In TEST mode, allow simulated signatures or fallback
    if (!isValid && env === 'TEST') {
      this.logger.warn(`Signature verification accepted in TEST mode for ${razorpayOrderId}`);
      isValid = true;
    }

    if (!isValid) {
      throw new BadRequestException('Payment verification failed: Invalid Razorpay signature.');
    }

    // 2. Check if this is a Wallet Top-up
    const topup = await this.topupRepo.findOne({
      where: { razorpayOrderId },
    });

    if (topup) {
      return this.processCompletedTopup(topup, razorpayPaymentId, razorpaySignature);
    }

    // 2b. Payments owned by other modules (e.g. a partner registration held until paid)
    const external = await this.findExternalHandler(razorpayOrderId);
    if (external) {
      return external.complete(razorpayOrderId, razorpayPaymentId);
    }

    // 3. Otherwise check if this is an Order
    const order = await this.orderRepo.findOne({
      where: { razorpayOrderId },
      relations: { user: true, product: true },
    });

    if (!order) {
      throw new NotFoundException(`Order or Top-up not found for Razorpay Order ID: ${razorpayOrderId}`);
    }

    return this.processCompletedOrder(order, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  }

  private async processCompletedOrder(
    order: Order,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    if (order.paymentStatus === PaymentStatus.PAID) {
      return {
        message: 'Payment already verified.',
        orderId: Number(order.id),
        paymentStatus: 'PAID',
        orderStatus: order.orderStatus,
      };
    }

    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await this.orderRepo.save(order);

    // Update attempt
    const attempt = await this.attemptRepo.findOne({
      where: { merchantOrderId: razorpayOrderId },
    });
    if (attempt) {
      attempt.status = PaymentAttemptStatus.COMPLETED;
      attempt.providerReferenceId = razorpayPaymentId;
      await this.attemptRepo.save(attempt);
    }

    // Confirm order payment and distribute commissions
    await this.orderService.confirmOrderPayment(Number(order.id), razorpayPaymentId);

    // Save event
    const event = this.eventRepo.create({
      razorpayOrderId,
      eventType: 'VERIFIED',
      payload: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
    });
    await this.eventRepo.save(event);

    this.logger.log(`Razorpay payment confirmed for order #${order.id}, paymentId: ${razorpayPaymentId}`);

    return {
      message: 'Payment verified and order confirmed successfully.',
      orderId: Number(order.id),
      paymentStatus: 'PAID',
      orderStatus: 'CONFIRMED',
      razorpayPaymentId,
    };
  }

  private async processCompletedTopup(
    topup: WalletTopup,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    if (topup.status === WalletTopupStatus.COMPLETED) {
      return {
        message: 'Top-up already completed.',
        topupId: Number(topup.id),
        status: 'COMPLETED',
        amount: Number(topup.amount),
      };
    }

    await this.orderRepo.manager.transaction(async (manager) => {
      const topupRow = await manager.getRepository(WalletTopup).findOne({
        where: { id: topup.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!topupRow || topupRow.status === WalletTopupStatus.COMPLETED) return;

      const walletTxn = await this.walletService.credit(
        topupRow.userId,
        Number(topupRow.amount),
        TransactionCategory.TOPUP,
        `Wallet top-up via Razorpay (${razorpayPaymentId})`,
        'TOPUP',
        String(topupRow.id),
        manager,
      );

      topupRow.status = WalletTopupStatus.COMPLETED;
      topupRow.razorpayPaymentId = razorpayPaymentId;
      topupRow.razorpaySignature = razorpaySignature;
      topupRow.walletTransactionId = walletTxn ? Number(walletTxn.id) : null;
      await manager.getRepository(WalletTopup).save(topupRow);
    });

    this.logger.log(`Razorpay topup completed for user #${topup.userId}, amount: ₹${Number(topup.amount) / 100}`);

    return {
      message: 'Top-up completed successfully. Wallet has been credited.',
      topupId: Number(topup.id),
      status: 'COMPLETED',
      amount: Number(topup.amount),
    };
  }

  // ─── 4. Check & Process Payment Status ─────────────────────────────
  async checkAndProcessPayment(
    razorpayOrderId: string,
    eventType: string = 'STATUS_CHECK',
    requestingUser?: { sub?: number; id?: number; role?: string },
  ): Promise<any> {
    // 1. Check top-up
    const topup = await this.topupRepo.findOne({
      where: { razorpayOrderId },
    });

    if (topup) {
      if (topup.status === WalletTopupStatus.COMPLETED) {
        return {
          message: 'Top-up already completed.',
          topupId: Number(topup.id),
          status: topup.status,
          amount: Number(topup.amount),
        };
      }

      // Check with Razorpay
      if (this.razorpayInstance && !razorpayOrderId.startsWith('order_topup_')) {
        try {
          const payments = await this.razorpayInstance.orders.fetchPayments(razorpayOrderId);
          const capturedPayment = payments?.items?.find((p: any) => p.status === 'captured');
          if (capturedPayment) {
            return this.processCompletedTopup(topup, capturedPayment.id, 'FETCHED');
          }
        } catch (err) {
          this.logger.warn(`Failed to fetch Razorpay payments for ${razorpayOrderId}:`, err);
        }
      }

      return {
        message: 'Top-up is pending.',
        topupId: Number(topup.id),
        status: topup.status,
      };
    }

    // 1b. Payments owned by other modules (e.g. a partner registration held until paid)
    const external = await this.findExternalHandler(razorpayOrderId);
    if (external) {
      return external.checkAndProcess(razorpayOrderId, eventType, requestingUser);
    }

    // 2. Check Order
    const order = await this.orderRepo.findOne({
      where: { razorpayOrderId },
    });

    if (!order) {
      throw new NotFoundException(`Order not found for Razorpay Order ID: ${razorpayOrderId}`);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return {
        message: 'Payment already confirmed.',
        orderId: Number(order.id),
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      };
    }

    // Check with Razorpay
    if (this.razorpayInstance && !razorpayOrderId.startsWith('order_test_')) {
      try {
        const payments = await this.razorpayInstance.orders.fetchPayments(razorpayOrderId);
        const capturedPayment = payments?.items?.find((p: any) => p.status === 'captured');
        if (capturedPayment) {
          return this.processCompletedOrder(order, razorpayOrderId, capturedPayment.id, 'FETCHED');
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch Razorpay payments for ${razorpayOrderId}:`, err);
      }
    }

    return {
      message: 'Payment is pending.',
      orderId: Number(order.id),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    };
  }

  // ─── 5. Webhook Handling ───────────────────────────────────────────
  async handleWebhook(payload: any, rawBody?: string, signature?: string): Promise<any> {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');

    if (webhookSecret && signature && rawBody) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        this.logger.error('Razorpay Webhook signature verification failed');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const event = payload?.event;

    // A. Payout Webhooks (RazorpayX: payout.reversed, payout.failed, payout.rejected, payout.processed)
    if (event?.startsWith('payout.')) {
      const payoutEntity = payload?.payload?.payout?.entity;
      const payoutId = payoutEntity?.id;
      const refId = payoutEntity?.reference_id; // e.g. VED_WD_4
      const status = payoutEntity?.status;
      const reason =
        payoutEntity?.status_details?.description ||
        payoutEntity?.failure_reason ||
        'Reversed by bank/Razorpay';

      this.logger.log(
        `[RazorpayX Webhook] ${event} for payout ${payoutId} (Ref: ${refId}, Status: ${status})`,
      );

      let withdrawalId: number | null = null;
      if (refId && typeof refId === 'string' && refId.startsWith('VED_WD_')) {
        withdrawalId = parseInt(refId.replace('VED_WD_', ''), 10);
      }

      if (event === 'payout.reversed' || event === 'payout.failed' || event === 'payout.rejected') {
        await this.walletService.handlePayoutReversalByPayoutIdOrId(
          withdrawalId,
          payoutId,
          reason,
          payoutEntity,
        );
      } else if (event === 'payout.processed') {
        await this.walletService.handlePayoutProcessed(withdrawalId, payoutId, payoutEntity);
      }

      return { status: 'SUCCESS', message: `Payout event ${event} processed` };
    }

    // B. Payment / Order Webhooks
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (event === 'payment.captured' || event === 'order.paid') {
      if (orderId && paymentId) {
        await this.checkAndProcessPayment(orderId, 'WEBHOOK');
      }
    }

    return { status: 'SUCCESS', message: 'Webhook processed' };
  }

  // ─── 6. Refund ─────────────────────────────────────────────────────
  async refundPayment(
    order: Order,
    amount: number,
  ): Promise<{ refundId: string; response: any }> {
    const paymentId = order.razorpayPaymentId;
    if (!paymentId) {
      throw new BadRequestException('Order does not have a payment ID to refund.');
    }

    if (this.razorpayInstance) {
      try {
        const response = await this.razorpayInstance.payments.refund(paymentId, {
          amount,
        });
        return { refundId: response.id, response };
      } catch (err: any) {
        this.logger.error('Razorpay refund failed:', err);
        throw new BadRequestException(`Razorpay refund failed: ${err.message}`);
      }
    }

    const testRefundId = `rfnd_test_${Date.now()}`;
    return {
      refundId: testRefundId,
      response: { id: testRefundId, status: 'processed' },
    };
  }
}
