import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './payment.service';
import { PaymentStatus, OrderStatus } from '../order/entity/order.entity';
import { ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('PaymentService Security Remediation', () => {
  let paymentService: PaymentService;
  let mockConfigService: any;
  let mockOrderRepo: any;
  let mockEventRepo: any;
  let mockAttemptRepo: any;
  let mockTopupRepo: any;
  let mockOrderService: any;
  let mockWalletService: any;
  let mockPhonePeClient: any;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'PHONEPE_CLIENT_ID') return 'test_client_id';
        if (key === 'PHONEPE_CLIENT_SECRET') return 'test_client_secret';
        if (key === 'PHONEPE_CALLBACK_USERNAME') return 'test_cb_user';
        if (key === 'PHONEPE_CALLBACK_PASSWORD') return 'test_cb_pass';
        return null;
      }),
    };

    mockOrderRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      manager: {
        transaction: vi.fn(async (cb) => cb({ getRepository: vi.fn() })),
      },
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

    mockPhonePeClient = {
      pay: vi.fn(),
      getOrderStatus: vi.fn(),
      validateCallback: vi.fn(),
      refund: vi.fn(),
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

    // Attach mock client
    (paymentService as any).client = mockPhonePeClient;
  });

  describe('Underpayment Fraud Prevention', () => {
    it('should throw BadRequestException if PhonePe paid amount does not match order amount', async () => {
      const order = {
        id: 101,
        userId: 5,
        totalAmount: 120000, // Expected: 120000 paise (₹1200)
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PENDING,
        phonepeMerchantOrderId: 'VEDORA_101_12345',
      };

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockPhonePeClient.getOrderStatus.mockResolvedValue({
        state: 'COMPLETED',
        amount: 10000, // Attacker manipulated payment to pay only 10000 paise (₹100)
        paymentDetails: [{ transactionId: 'TXN_UNDERPAID' }],
      });

      await expect(
        paymentService.checkAndProcessPayment('VEDORA_101_12345', 'STATUS_CHECK'),
      ).rejects.toThrow(BadRequestException);

      expect(mockOrderService.confirmOrderPayment).not.toHaveBeenCalled();
    });

    it('should confirm payment if reported amount matches order amount', async () => {
      const order = {
        id: 101,
        userId: 5,
        totalAmount: 120000,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PENDING,
        phonepeMerchantOrderId: 'VEDORA_101_12345',
      };

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockPhonePeClient.getOrderStatus.mockResolvedValue({
        state: 'COMPLETED',
        amount: 120000,
        paymentDetails: [{ transactionId: 'TXN_MATCHED' }],
      });

      const res = await paymentService.checkAndProcessPayment('VEDORA_101_12345', 'STATUS_CHECK');

      expect(res.paymentStatus).toBe('PAID');
      expect(mockOrderService.confirmOrderPayment).toHaveBeenCalledWith(101, 'TXN_MATCHED');
    });
  });

  describe('IDOR Protection on Payment Status Check', () => {
    it('should throw ForbiddenException if requester is not the order owner or admin', async () => {
      const order = {
        id: 101,
        userId: 5, // Order belongs to user #5
        totalAmount: 120000,
        paymentStatus: PaymentStatus.PENDING,
        phonepeMerchantOrderId: 'VEDORA_101_12345',
      };

      mockOrderRepo.findOne.mockResolvedValue(order);

      // User #9 attempts to check status of user #5's order
      await expect(
        paymentService.checkAndProcessPayment(
          'VEDORA_101_12345',
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
        phonepeMerchantOrderId: 'VEDORA_101_12345',
      };

      mockOrderRepo.findOne.mockResolvedValue(order);

      const res = await paymentService.checkAndProcessPayment(
        'VEDORA_101_12345',
        'STATUS_CHECK',
        { sub: 1, role: 'ADMIN' },
      );

      expect(res.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });

  describe('Webhook Authentication Validation', () => {
    it('should reject webhook with missing authorization header when callback credentials are set', async () => {
      await expect(
        paymentService.handleWebhook({ merchantOrderId: 'VEDORA_101_123' }, undefined, undefined),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject webhook when callback signature validation fails', async () => {
      mockPhonePeClient.validateCallback.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        paymentService.handleWebhook(
          { merchantOrderId: 'VEDORA_101_123' },
          'rawbody',
          'invalid_auth_header',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
