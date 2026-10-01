import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, PaymentStatus } from '../order/entity/order.entity';
import { PaymentEvent } from './entity/payment-event.entity';
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
    private readonly orderService: OrderService,
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

  // ─── Initiate PhonePe Payment ───────────────────────────────────────

  async initiatePayment(orderId: number): Promise<{ redirectUrl: string; merchantOrderId: string }> {
    this.ensureClient();

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found.');

    const { StandardCheckoutPayRequest } = await import('@phonepe-pg/pg-sdk-node');

    const merchantOrderId = `VEDORA_${order.id}_${Date.now()}`;
    const redirectUrl = this.configService.get<string>('PHONEPE_REDIRECT_URL') || 'http://localhost:5173/payment/status';

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Number(order.totalAmount)) // Already in paise
      .redirectUrl(redirectUrl)
      .build();

    const response = await this.client.pay(request);

    // Save merchant order ID on the order
    order.phonepeMerchantOrderId = merchantOrderId;
    order.phonepeRedirectUrl = response.redirectUrl;
    await this.orderRepo.save(order);

    this.logger.log(`PhonePe payment initiated for order #${orderId}, merchantOrderId: ${merchantOrderId}`);

    return {
      redirectUrl: response.redirectUrl,
      merchantOrderId,
    };
  }

  // ─── Check Payment Status ──────────────────────────────────────────

  async checkAndProcessPayment(merchantOrderId: string, eventType: string = 'STATUS_CHECK'): Promise<any> {
    this.ensureClient();

    // Find the order by merchant order ID
    const order = await this.orderRepo.findOne({
      where: { phonepeMerchantOrderId: merchantOrderId },
    });

    if (!order) {
      throw new NotFoundException(`Order not found for merchantOrderId: ${merchantOrderId}`);
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
      // Payment successful — confirm order and distribute commissions
      await this.orderService.confirmOrderPayment(
        Number(order.id),
        statusResponse?.paymentDetails?.[0]?.transactionId || null,
      );

      return {
        message: 'Payment confirmed. Order processed successfully.',
        orderId: Number(order.id),
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
      };
    } else if (state === 'FAILED' || state === 'DECLINED') {
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

  async handleWebhook(payload: any) {
    const merchantOrderId = payload?.merchantOrderId || payload?.data?.merchantOrderId;

    if (!merchantOrderId) {
      this.logger.warn('Webhook received without merchantOrderId');
      return { message: 'Invalid webhook payload' };
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
}
