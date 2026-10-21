import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './payment.service';
import { PaymentStatus, OrderStatus } from '../order/entity/order.entity';
import { ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('PaymentService Razorpay Security & Verification', () => {
  let paymentService: PaymentService;
  let mockConfigService: any;
  let mockOrderRepo: any;
  let mockEventRepo: any;
  let mockAttemptRepo: any;
  let mockTopupRepo: any;
  let mockOrderService: any;
  let mockWalletService: any;

  const testKeySecret = 'test_secret_12345';

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_12345';
        if (key === 'RAZORPAY_KEY_SECRET') return testKeySecret;
        if (key === 'RAZORPAY_WEBHOOK_SECRET') return 'test_webhook_secret';
        return null;
      }),
    };

    mockOrderRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn((data) => data),
    };

    mockEventRepo = {
      create: vi.fn((data) => data),
      save: vi.fn(),
    };

    mockAttemptRepo = {
      create: vi.fn((data) => data),
      save: vi.fn(),
      findOne: vi.fn(),
    };

    mockTopupRepo = {
      create: vi.fn((data) => data),
      save: vi.fn(),
      findOne: vi.fn(),
    };

    mockOrderService = {
      confirmOrderPayment: vi.fn(),
      failOrderPayment: vi.fn(),
    };

    mockWalletService = {
      credit: vi.fn(),
      debit: vi.fn(),
    };

    paymentService = new PaymentService(
      mockConfigService,
      mockOrderRepo,
      mockEventRepo,
      mockAttemptRepo,
      mockTopupRepo,
      mockOrderService,
      mockWalletService,
    );
  });

  describe('Signature Verification', () => {
    it('should throw BadRequestException if Razorpay signature is invalid', async () => {
      await expect(
        paymentService.verifyPayment({
          razorpayOrderId: 'order_12345',
          razorpayPaymentId: 'pay_12345',
          razorpaySignature: 'invalid_tampered_signature',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOrderService.confirmOrderPayment).not.toHaveBeenCalled();
    });

    it('should confirm payment if Razorpay signature is valid for an order', async () => {
      const orderId = 'order_valid_123';
      const paymentId = 'pay_valid_456';
      const validSignature = crypto
        .createHmac('sha256', testKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const mockOrder = {
        id: 101,
        userId: 5,
        totalAmount: 120000,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PENDING,
        razorpayOrderId: orderId,
      };

      mockTopupRepo.findOne.mockResolvedValue(null);
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockAttemptRepo.findOne.mockResolvedValue(null);

      const res = await paymentService.verifyPayment({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

      expect(res.paymentStatus).toBe('PAID');
      expect(mockOrderService.confirmOrderPayment).toHaveBeenCalledWith(101, paymentId);
    });
  });

  describe('IDOR Protection on Payment Status Check', () => {
    it('should throw ForbiddenException if requester is not the order owner or admin', async () => {
      const order = {
        id: 101,
        userId: 5, // Order belongs to user #5
        totalAmount: 120000,
        paymentStatus: PaymentStatus.PENDING,
        razorpayOrderId: 'order_101_12345',
      };

      mockTopupRepo.findOne.mockResolvedValue(null);
      mockOrderRepo.findOne.mockResolvedValue(order);

      // User #9 attempts to check status of user #5's order
      await expect(
        paymentService.checkAndProcessPayment(
          'order_101_12345',
          'STATUS_CHECK',
          { sub: 9, role: 'PARTNER' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to check status of any order', async () => {
      const order = {
        id: 101,
        userId: 5,
        totalAmount: 120000,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.CONFIRMED,
        razorpayOrderId: 'order_101_12345',
      };

      mockTopupRepo.findOne.mockResolvedValue(null);
      mockOrderRepo.findOne.mockResolvedValue(order);

      const res = await paymentService.checkAndProcessPayment(
        'order_101_12345',
        'STATUS_CHECK',
        { sub: 1, role: 'ADMIN' },
      );

      expect(res.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });

  describe('Webhook Authentication Validation', () => {
    it('should reject webhook with missing signature header when webhook secret is configured', async () => {
      await expect(
        paymentService.handleWebhook({ event: 'payment.captured' }, undefined, undefined),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject webhook when signature header does not match computed HMAC', async () => {
      await expect(
        paymentService.handleWebhook(
          { event: 'payment.captured' },
          JSON.stringify({ event: 'payment.captured' }),
          'invalid_webhook_signature',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
