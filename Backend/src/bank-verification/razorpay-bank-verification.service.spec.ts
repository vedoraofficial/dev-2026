import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RazorpayBankVerificationService } from './razorpay-bank-verification.service';

describe('RazorpayBankVerificationService (Penny Drop Security & Verification)', () => {
  let verificationService: RazorpayBankVerificationService;
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

    verificationService = new RazorpayBankVerificationService(mockConfigService);
  });

  describe('Pre-validation Format Checks', () => {
    it('should validate standard RBI IFSC format (4 letters, 0, 6 alphanumeric)', () => {
      expect(verificationService.validateIfsc('SBIN0000284')).toBe(true);
      expect(verificationService.validateIfsc('HDFC0001234')).toBe(true);
      expect(verificationService.validateIfsc('INVALIDIFSC')).toBe(false);
      expect(verificationService.validateIfsc('SBIN1000284')).toBe(false); // 5th char not '0'
    });

    it('should reject invalid IFSC format before calling API', async () => {
      const res = await verificationService.verifyBankAccount({
        accountNumber: '123456789012',
        ifscCode: 'INVALID',
        accountHolderName: 'Rahul Sharma',
      });

      expect(res.isValid).toBe(false);
      expect(res.accountStatusCode).toBe('INVALID_IFSC');
    });

    it('should reject invalid account number with length < 5', async () => {
      const res = await verificationService.verifyBankAccount({
        accountNumber: '123',
        ifscCode: 'SBIN0000284',
        accountHolderName: 'Rahul Sharma',
      });

      expect(res.isValid).toBe(false);
      expect(res.accountStatusCode).toBe('INVALID_ACCOUNT_NUMBER');
    });
  });

  describe('Live Mode Security & Fallback Prevention', () => {
    it('should reject with CONFIG_ERROR in production if credentials missing', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockConfigService.get = vi.fn(() => null);

      const res = await verificationService.verifyBankAccount({
        accountNumber: '123456789012',
        ifscCode: 'SBIN0000284',
        accountHolderName: 'Rahul Sharma',
      });

      expect(res.isValid).toBe(false);
      expect(res.accountStatusCode).toBe('CONFIG_ERROR');

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should reject if live bank response is missing registered_name', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'RAZORPAY_KEY_ID') return 'rzp_live_key';
        if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_live_secret';
        if (key === 'RAZORPAY_ACCOUNT_NUMBER') return '2323230055471220';
        if (key === 'RAZORPAY_ENV') return 'LIVE';
        return null;
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'fav_live_101',
              status: 'completed',
              results: {
                account_status: 'active',
                registered_name: null, // Bank omitted registered name
              },
            }),
        }),
      );

      const res = await verificationService.verifyBankAccount({
        accountNumber: '123456789012',
        ifscCode: 'SBIN0000284',
        accountHolderName: 'Rahul Sharma',
        userName: 'Rahul Sharma',
      });

      expect(res.isValid).toBe(false);
      expect(res.accountStatusCode).toBe('NAME_NOT_RETURNED');

      vi.unstubAllGlobals();
    });

    it('should reject if bank registered name does not match user KYC name', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'RAZORPAY_KEY_ID') return 'rzp_live_key';
        if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_live_secret';
        if (key === 'RAZORPAY_ACCOUNT_NUMBER') return '2323230055471220';
        if (key === 'RAZORPAY_ENV') return 'LIVE';
        return null;
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'fav_live_102',
              status: 'completed',
              results: {
                account_status: 'active',
                registered_name: 'VIJAY PRATAP SINGH', // Completely different person
              },
            }),
        }),
      );

      const res = await verificationService.verifyBankAccount({
        accountNumber: '123456789012',
        ifscCode: 'SBIN0000284',
        accountHolderName: 'Rahul Sharma',
        userName: 'Rahul Sharma',
      });

      expect(res.isValid).toBe(false);
      expect(res.accountStatusCode).toBe('NAME_MISMATCH');

      vi.unstubAllGlobals();
    });

    it('should return PENDING in live mode when bank response times out without falling back to sandbox', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'RAZORPAY_KEY_ID') return 'rzp_live_key';
        if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_live_secret';
        if (key === 'RAZORPAY_ACCOUNT_NUMBER') return '2323230055471220';
        if (key === 'RAZORPAY_ENV') return 'LIVE';
        return null;
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'fav_live_pending_99',
              status: 'created', // Still created after IMPS delay
            }),
        }),
      );

      const res = await verificationService.verifyBankAccount({
        accountNumber: '123456789012',
        ifscCode: 'SBIN0000284',
        accountHolderName: 'Rahul Sharma',
        userName: 'Rahul Sharma',
      });

      expect(res.isValid).toBe(false);
      expect(res.accountStatusCode).toBe('VERIFICATION_PENDING');

      vi.unstubAllGlobals();
    });
  });

  describe('Sandbox/Test Mode Simulation Safeguards', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'fav_sandbox_ref',
              status: 'created', // Razorpay sandbox returns created
            }),
        }),
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should reject dummy invalid account ending in 0000 or 9999 or 1234 in test mode', async () => {
      const res = await verificationService.verifyBankAccount({
        accountNumber: '123456780000',
        ifscCode: 'SBIN0000284',
        accountHolderName: 'Rahul Sharma',
      });

      expect(res.isValid).toBe(false);
      expect(res.accountStatusCode).toBe('BENEFICIARY_BANK_REJECTED');
    });

    it('should simulate name mismatch rejection when account ends in 4444', async () => {
      const res = await verificationService.verifyBankAccount({
        accountNumber: '987654324444',
        ifscCode: 'SBIN0000284',
        accountHolderName: 'Rahul Sharma',
        userName: 'Rahul Sharma',
      });

      expect(res.isValid).toBe(false);
      expect(res.accountStatusCode).toBe('NAME_MISMATCH');
    });
  });
});
