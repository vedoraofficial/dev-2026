import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RazorpayPayoutService } from './razorpay-payout.service';

describe('RazorpayPayoutService Payout Idempotency & Safety', () => {
  let payoutService: RazorpayPayoutService;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_key123';
        if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_test_secret456';
        if (key === 'RAZORPAY_ACCOUNT_NUMBER') return '2323230055471220';
        if (key === 'RAZORPAY_ENV') return 'TEST';
        return null;
      }),
    };

    payoutService = new RazorpayPayoutService(mockConfigService);
  });

  it('should use deterministic, stable idempotency key VED_WD_<id> on payout execution', async () => {
    let capturedHeaders: any;

    // Mock global fetch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url, options) => {
        capturedHeaders = options.headers;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'pout_test_101',
              status: 'processing',
              utr: 'CMS9999888877',
            }),
        });
      }),
    );

    const result = await payoutService.executePayout({
      withdrawalId: 42,
      amountPaise: 50000,
      accountNumber: '123456789012',
      ifscCode: 'SBIN0000284',
      accountHolderName: 'Rahul Sharma',
    });

    expect(capturedHeaders['X-Payout-Idempotency']).toBe('VED_WD_42');
    expect(result.success).toBe(true);
    expect(result.payoutId).toBe('pout_test_101');
    expect(result.utr).toBe('CMS9999888877');

    vi.unstubAllGlobals();
  });

  it('should reject account number if it is an account ID (acc_...)', async () => {
    mockConfigService.get = vi.fn((key: string) => {
      if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_key123';
      if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_test_secret456';
      if (key === 'RAZORPAY_ACCOUNT_NUMBER') return 'acc_invalidMerchantId';
      return null;
    });

    const result = await payoutService.executePayout({
      withdrawalId: 43,
      amountPaise: 25000,
      accountNumber: '123456789012',
      ifscCode: 'SBIN0000284',
      accountHolderName: 'Rahul Sharma',
    });

    expect(result.success).toBe(false);
    expect(result.remarks).toContain('Invalid RAZORPAY_ACCOUNT_NUMBER');
  });

  it('should never simulate payout in production or LIVE environment if credentials missing', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    mockConfigService.get = vi.fn((key: string) => {
      if (key === 'RAZORPAY_ENV') return 'LIVE';
      return null; // Missing keys
    });

    const result = await payoutService.executePayout({
      withdrawalId: 44,
      amountPaise: 100000,
      accountNumber: '123456789012',
      ifscCode: 'SBIN0000284',
      accountHolderName: 'Rahul Sharma',
    });

    expect(result.success).toBe(false);
    expect(result.remarks).toContain('cannot be simulated');

    process.env.NODE_ENV = originalNodeEnv;
  });
});
