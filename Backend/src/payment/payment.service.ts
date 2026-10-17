import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, PaymentStatus } from '../order/entity/order.entity';
import { PaymentEvent } from './entity/payment-event.entity';
import { PaymentAttempt, PaymentAttemptStatus } from './entity/payment-attempt.entity';
import { WalletTopup, WalletTopupStatus } from '../wallet/entity/wallet-topup.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionCategory } from '../wallet/entity/wallet-transaction.entity';
import { OrderService } from '../order/order.service';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private client: any = null;

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
    await this.initializePhonePeClient();
  }

  private async initializePhonePeClient() {
    const clientId = this.configService.get<string>('PHONEPE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PHONEPE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.warn(
        'PhonePe credentials not configured. Payment gateway will not be available. ' +
        'Set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in .env',
      );
      return;
    }

    try {
      const { StandardCheckoutClient, Env } = await import('@phonepe-pg/pg-sdk-node');

      const clientVersion = this.configService.get<number>('PHONEPE_CLIENT_VERSION') || 1;
      const envStr = this.configService.get<string>('PHONEPE_ENV') || 'SANDBOX';
      const env = envStr === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

      this.client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
      this.logger.log(`PhonePe client initialized (${envStr} mode)`);
    } catch (error) {
      this.logger.error('Failed to initialize PhonePe client:', error);
    }
  }

  private ensureClient() {
    if (!this.client) {
      throw new InternalServerErrorException(
        'PhonePe payment gateway is not configured. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in .env',
      );
    }
  }

  // ─── Initiate PhonePe Payment for an Order ─────────────────────────

  async initiatePayment(orderId: number): Promise<{ redirectUrl: string; merchantOrderId: string }> {
    this.ensureClient();

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid.');
    }

    const { StandardCheckoutPayRequest } = await import('@phonepe-pg/pg-sdk-node');

    const merchantOrderId = `VEDORA_${order.id}_${Date.now()}`;
    const baseRedirectUrl =
      this.configService.get<string>('PHONEPE_REDIRECT_URL') ||
      'http://localhost:5173/payment/status';
    const separator = baseRedirectUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${baseRedirectUrl}${separator}merchantOrderId=${encodeURIComponent(merchantOrderId)}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Number(order.totalAmount)) // Already in paise
      .redirectUrl(redirectUrl)
      .build();

    const response = await this.client.pay(request);

    // Record the payment attempt to prevent losing track of retried sessions
    const attempt = this.attemptRepo.create({
      orderId: Number(order.id),
      merchantOrderId,
      amount: Number(order.totalAmount),
      status: PaymentAttemptStatus.INITIATED,
      redirectUrl: response.redirectUrl,
    });
    await this.attemptRepo.save(attempt);

    // Save active merchant order ID and redirect URL on the order
    order.phonepeMerchantOrderId = merchantOrderId;
    order.phonepeRedirectUrl = response.redirectUrl;
    await this.orderRepo.save(order);

    this.logger.log(`PhonePe payment initiated for order #${orderId}, attempt merchantOrderId: ${merchantOrderId}`);

    return {
      redirectUrl: response.redirectUrl,
      merchantOrderId,
    };
  }

  // ─── Initiate Wallet Top-Up (Add-Money) ─────────────────────────────

  async initiateTopup(
    userId: number,
    amount: number,
  ): Promise<{ redirectUrl: string; merchantOrderId: string; amount: number }> {
    this.ensureClient();

    if (amount < 10000) {
      throw new BadRequestException('Minimum top-up amount is ₹100 (10,000 paise).');
    }

    const { StandardCheckoutPayRequest } = await import('@phonepe-pg/pg-sdk-node');

    const merchantOrderId = `TOPUP_${userId}_${Date.now()}`;
    const baseRedirectUrl =
      this.configService.get<string>('PHONEPE_TOPUP_REDIRECT_URL') ||
      this.configService.get<string>('PHONEPE_REDIRECT_URL') ||
      'http://localhost:5173/payment/status';
    const separator = baseRedirectUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${baseRedirectUrl}${separator}merchantOrderId=${encodeURIComponent(merchantOrderId)}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await this.client.pay(request);

    const topup = this.topupRepo.create({
      userId,
      amount,
      status: WalletTopupStatus.PENDING,
      phonepeMerchantOrderId: merchantOrderId,
      phonepeRedirectUrl: response.redirectUrl,
    });
    await this.topupRepo.save(topup);

    this.logger.log(`PhonePe top-up initiated for user #${userId}, merchantOrderId: ${merchantOrderId}`);

    return {
      redirectUrl: response.redirectUrl,
      merchantOrderId,
      amount,
    };
  }

  // ─── Check & Process Wallet Top-Up ─────────────────────────────────

  async checkAndProcessTopup(
    merchantOrderId: string,
    eventType: string = 'STATUS_CHECK',
    requestingUser?: { sub?: number; id?: number; role?: string },
  ): Promise<any> {
    this.ensureClient();

    const topup = await this.topupRepo.findOne({
      where: { phonepeMerchantOrderId: merchantOrderId },
    });

    if (!topup) {
      throw new NotFoundException(`Top-up not found for merchantOrderId: ${merchantOrderId}`);
    }

    // IDOR protection
    if (requestingUser) {
      const requesterId = Number(requestingUser.sub || requestingUser.id);
      const isOwner = Number(topup.userId) === requesterId;
      const isAdmin = requestingUser.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You do not have permission to check this topup payment.');
      }
    }

    if (topup.status === WalletTopupStatus.COMPLETED) {
      return {
        message: 'Top-up already completed.',
        topupId: Number(topup.id),
        status: topup.status,
        amount: Number(topup.amount),
      };
    }

    const statusResponse = await this.client.getOrderStatus(merchantOrderId);

    const event = this.eventRepo.create({
      phonepeMerchantOrderId: merchantOrderId,
      eventType,
      payload: statusResponse,
    });
    await this.eventRepo.save(event);

    const state = statusResponse?.state?.toUpperCase?.() || statusResponse?.state || '';

    if (state === 'COMPLETED' || state === 'SUCCESS') {
      const reportedAmount = statusResponse?.amount ?? statusResponse?.data?.amount;
      if (reportedAmount !== undefined && Number(reportedAmount) !== Number(topup.amount)) {
        this.logger.error(
          `Security Alert: Topup amount mismatch. Expected: ${topup.amount} paise, PhonePe reported: ${reportedAmount} paise.`,
        );
        throw new BadRequestException('Topup payment amount mismatch detected.');
      }

      const transactionId = statusResponse?.paymentDetails?.[0]?.transactionId || null;

      // Credit wallet atomically with row lock
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
          `Wallet balance top-up via PhonePe (${transactionId || ''})`,
          'TOPUP',
          String(topupRow.id),
          manager,
        );

        topupRow.status = WalletTopupStatus.COMPLETED;
        topupRow.phonepeTransactionId = transactionId;
        topupRow.walletTransactionId = walletTxn ? Number(walletTxn.id) : null;
        await manager.getRepository(WalletTopup).save(topupRow);
      });

      return {
        message: 'Top-up completed successfully. Wallet has been credited.',
        topupId: Number(topup.id),
        status: 'COMPLETED',
        amount: Number(topup.amount),
      };
    } else if (state === 'FAILED' || state === 'DECLINED') {
      topup.status = WalletTopupStatus.FAILED;
      await this.topupRepo.save(topup);

      return {
        message: 'Top-up payment failed.',
        topupId: Number(topup.id),
        status: 'FAILED',
      };
    } else {
      return {
        message: 'Top-up is still pending.',
        topupId: Number(topup.id),
        status: 'PENDING',
        phonepeState: state,
      };
    }
  }

  // ─── Check & Process Payment (Order or Top-up) ─────────────────────

  async checkAndProcessPayment(
    merchantOrderId: string,
    eventType: string = 'STATUS_CHECK',
    requestingUser?: { sub?: number; id?: number; role?: string },
  ): Promise<any> {
    this.ensureClient();

    // 1. Dispatch Top-up if merchantOrderId starts with TOPUP_
    if (merchantOrderId.startsWith('TOPUP_')) {
      return this.checkAndProcessTopup(merchantOrderId, eventType, requestingUser);
    }

    // 2. Find order directly, or via payment_attempts if retried
    let order = await this.orderRepo.findOne({
      where: { phonepeMerchantOrderId: merchantOrderId },
    });

    let attempt: PaymentAttempt | null = null;
    if (!order) {
      attempt = await this.attemptRepo.findOne({
        where: { merchantOrderId },
        relations: { order: true },
      });
      if (attempt?.order) {
        order = attempt.order;
      }
    } else {
      attempt = await this.attemptRepo.findOne({
        where: { merchantOrderId },
      });
    }

    if (!order) {
      throw new NotFoundException(`Order not found for merchantOrderId: ${merchantOrderId}`);
    }

    // IDOR protection: if requested by a user, ensure ownership or ADMIN role
    if (requestingUser) {
      const requesterId = Number(requestingUser.sub || requestingUser.id);
      const isOwner = Number(order.userId) === requesterId;
      const isAdmin = requestingUser.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You do not have permission to check this payment status.');
      }
    }

    // Already processed? Return current status
    if (order.paymentStatus === PaymentStatus.PAID) {
      return {
        message: 'Payment already confirmed.',
        orderId: Number(order.id),
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      };
    }

    // Check status with PhonePe
    const statusResponse = await this.client.getOrderStatus(merchantOrderId);

    // Log the raw event
    const event = this.eventRepo.create({
      phonepeMerchantOrderId: merchantOrderId,
      eventType,
      payload: statusResponse,
    });
    await this.eventRepo.save(event);

    // Process based on state
    const state = statusResponse?.state?.toUpperCase?.() || statusResponse?.state || '';

    if (state === 'COMPLETED' || state === 'SUCCESS') {
      // Amount verification: prevent underpayment fraud
      const reportedAmount = statusResponse?.amount ?? statusResponse?.data?.amount;
      if (reportedAmount !== undefined && Number(reportedAmount) !== Number(order.totalAmount)) {
        this.logger.error(
          `Security Alert: Amount mismatch for order #${order.id}. Expected: ${order.totalAmount} paise, PhonePe reported: ${reportedAmount} paise.`,
        );
        throw new BadRequestException('Payment amount mismatch detected. Order cannot be confirmed.');
      }

      const transactionId = statusResponse?.paymentDetails?.[0]?.transactionId || null;

      // Update attempt status if tracked
      if (attempt) {
        attempt.status = PaymentAttemptStatus.COMPLETED;
        attempt.providerReferenceId = transactionId;
        await this.attemptRepo.save(attempt);
      }

      // Payment successful — confirm order and distribute commissions
      await this.orderService.confirmOrderPayment(
        Number(order.id),
        transactionId,
      );

      return {
        message: 'Payment confirmed. Order processed successfully.',
        orderId: Number(order.id),
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
      };
    } else if (state === 'FAILED' || state === 'DECLINED') {
      if (attempt) {
        attempt.status = PaymentAttemptStatus.FAILED;
        await this.attemptRepo.save(attempt);
      }

      await this.orderService.failOrderPayment(Number(order.id));

      return {
        message: 'Payment failed.',
        orderId: Number(order.id),
        paymentStatus: 'FAILED',
        orderStatus: 'CANCELLED',
      };
    } else {
      // PENDING or other state
      return {
        message: 'Payment is still pending.',
        orderId: Number(order.id),
        paymentStatus: 'PENDING',
        phonepeState: state,
      };
    }
  }

  // ─── Handle Callback (redirect from PhonePe) ──────────────────────

  async handleCallback(merchantOrderId: string) {
    return this.checkAndProcessPayment(merchantOrderId, 'CALLBACK');
  }

  // ─── Handle Webhook (server-to-server from PhonePe) ────────────────

  async handleWebhook(payload: any, rawBody?: Buffer | string, authHeader?: string) {
    const cbUser = this.configService.get<string>('PHONEPE_CALLBACK_USERNAME');
    const cbPass = this.configService.get<string>('PHONEPE_CALLBACK_PASSWORD');

    // If callback authentication credentials are configured, validate the signature
    if (cbUser && cbPass) {
      if (!authHeader) {
        this.logger.warn('Webhook rejected: Missing authorization header');
        throw new UnauthorizedException('Missing webhook authorization header');
      }

      try {
        const bodyStr = Buffer.isBuffer(rawBody)
          ? rawBody.toString('utf8')
          : typeof rawBody === 'string'
            ? rawBody
            : JSON.stringify(payload);

        this.client.validateCallback(cbUser, cbPass, authHeader, bodyStr);
      } catch (error) {
        this.logger.warn('Webhook authorization validation failed:', error);
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else {
      const env = this.configService.get<string>('PHONEPE_ENV');
      if (env === 'PRODUCTION') {
        this.logger.error('CRITICAL: PhonePe webhook received in PRODUCTION but callback credentials are not configured.');
        throw new UnauthorizedException('Webhook credentials not configured in production');
      }
    }

    const merchantOrderId = payload?.merchantOrderId || payload?.data?.merchantOrderId;

    if (!merchantOrderId) {
      this.logger.log('Webhook test/verification event received (no merchantOrderId). Acknowledging successfully.');
      return { status: 'SUCCESS', message: 'Webhook endpoint verified successfully' };
    }

    // Log raw webhook event regardless
    const event = this.eventRepo.create({
      phonepeMerchantOrderId: merchantOrderId,
      eventType: 'WEBHOOK',
      payload,
    });
    await this.eventRepo.save(event);

    // Process the payment
    try {
      return await this.checkAndProcessPayment(merchantOrderId, 'WEBHOOK');
    } catch (error) {
      this.logger.error(`Error processing webhook for ${merchantOrderId}:`, error);
      return { message: 'Webhook received and logged.' };
    }
  }

  // ─── PhonePe Refund ───────────────────────────────────────────────

  async refundPhonePePayment(
    order: Order,
    amount: number,
  ): Promise<{ refundId: string; response: any }> {
    this.ensureClient();

    if (!order.phonepeMerchantOrderId) {
      throw new BadRequestException('Order does not have a PhonePe merchant order ID to refund.');
    }

    const { RefundRequest } = await import('@phonepe-pg/pg-sdk-node');

    const merchantRefundId = `REFUND_${order.id}_${Date.now()}`;
    const request = RefundRequest.builder()
      .merchantRefundId(merchantRefundId)
      .originalMerchantOrderId(order.phonepeMerchantOrderId)
      .amount(amount)
      .build();

    const response = await this.client.refund(request);
    this.logger.log(`PhonePe refund initiated for order #${order.id}, refundId: ${merchantRefundId}`);

    return {
      refundId: merchantRefundId,
      response,
    };
  }
}
