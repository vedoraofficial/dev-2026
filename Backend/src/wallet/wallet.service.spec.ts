import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from './wallet.service';
import { WithdrawalStatus } from './entity/withdrawal.entity';
import { TransactionType, TransactionCategory } from './entity/wallet-transaction.entity';

describe('WalletService Withdrawal & Payout Reversal Integrity', () => {
  let walletService: WalletService;
  let mockDataSource: any;
  let mockWalletRepo: any;
  let mockTxnRepo: any;
  let mockWithdrawalRepo: any;
  let mockBankRepo: any;
  let mockNotificationService: any;
  let mockRazorpayPayoutService: any;

  beforeEach(() => {
    mockWalletRepo = {
      findOne: vi.fn(),
      update: vi.fn(),
      create: vi.fn((d) => d),
      save: vi.fn((d) => d),
      createQueryBuilder: vi.fn(),
    };

    mockTxnRepo = {
      create: vi.fn((d) => d),
      save: vi.fn((d) => Promise.resolve({ id: 99, ...d })),
    };

    mockWithdrawalRepo = {
      findOne: vi.fn(),
      save: vi.fn((d) => Promise.resolve(d)),
      createQueryBuilder: vi.fn(),
    };

    mockBankRepo = {
      findOne: vi.fn(),
    };

    mockNotificationService = {
      create: vi.fn().mockResolvedValue({}),
      notifyAllAdmins: vi.fn().mockResolvedValue({}),
    };

    mockRazorpayPayoutService = {
      executePayout: vi.fn(),
      getPayoutStatus: vi.fn(),
    };

    mockDataSource = {
      transaction: vi.fn((cb) => {
        const mockManager = {
          getRepository: (entity: any) => {
            if (entity.name === 'Wallet') return mockWalletRepo;
            if (entity.name === 'WalletTransaction') return mockTxnRepo;
            if (entity.name === 'Withdrawal') return mockWithdrawalRepo;
            if (entity.name === 'UserBank') return mockBankRepo;
            return { findOne: vi.fn(), save: vi.fn() };
          },
        };
        return cb(mockManager);
      }),
    };

    walletService = new WalletService(
      mockDataSource,
      mockWalletRepo,
      mockTxnRepo,
      mockWithdrawalRepo,
      mockBankRepo,
      mockNotificationService,
      mockRazorpayPayoutService,
    );
  });

  describe('Withdrawal Approval', () => {
    it('should execute payout and record payoutId and utr on withdrawal entity', async () => {
      const mockWithdrawal: any = {
        id: 10,
        userId: 5,
        amount: 50000,
        status: WithdrawalStatus.PENDING,
        bank: {
          accountNumber: '123456789012',
          ifscCode: 'SBIN0000284',
          accountHolderName: 'Rahul Sharma',
          bankName: 'SBI',
        },
        user: { mobile: '9999999999', email: 'user@test.com' },
      };

      mockWithdrawalRepo.findOne.mockResolvedValue(mockWithdrawal);

      mockRazorpayPayoutService.executePayout.mockResolvedValue({
        success: true,
        payoutId: 'pout_approved_123',
        utr: 'CMS_UTR_999',
        referenceId: 'pout_approved_123',
        remarks: 'Payout successful',
      });

      // Mock wallet locked balance check in confirmWithdrawal
      const mockWallet = {
        id: 1,
        userId: 5,
        lockedBalance: 50000,
        totalWithdrawn: 0,
      };
      mockWalletRepo.createQueryBuilder.mockReturnValue({
        setLock: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockWallet),
      });

      const res = await walletService.approveWithdrawal(10, 1);

      expect(res.withdrawal.status).toBe(WithdrawalStatus.APPROVED);
      expect(mockWithdrawal.payoutId).toBe('pout_approved_123');
      expect(mockWithdrawal.utr).toBe('CMS_UTR_999');
      expect(mockWithdrawalRepo.save).toHaveBeenCalled();
    });
  });

  describe('Payout Reversals', () => {
    it('should reverse withdrawal by payoutId and restore wallet available balance exactly once', async () => {
      const mockWithdrawal: any = {
        id: 10,
        userId: 5,
        amount: 50000,
        payoutId: 'pout_to_reverse_456',
        status: WithdrawalStatus.APPROVED,
      };

      mockWithdrawalRepo.findOne.mockResolvedValue(mockWithdrawal);

      const mockWallet = {
        id: 1,
        userId: 5,
        availableBalance: 20000,
        totalWithdrawn: 50000,
      };
      mockWalletRepo.createQueryBuilder.mockReturnValue({
        setLock: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockWallet),
      });

      const res = await walletService.handlePayoutReversalByPayoutIdOrId(
        10,
        'pout_to_reverse_456',
        'Account closed',
      );

      expect(res?.status).toBe(WithdrawalStatus.REVERSED);
      // Available balance increased by 50000 (20000 -> 70000)
      expect(mockWalletRepo.update).toHaveBeenCalledWith(1, {
        availableBalance: 70000,
        totalWithdrawn: 0,
      });

      // Recorded WITHDRAWAL_REVERSAL transaction
      expect(mockTxnRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.CREDIT,
          category: TransactionCategory.WITHDRAWAL_REVERSAL,
          amount: 50000,
          balanceAfter: 70000,
        }),
      );
    });

    it('should be idempotent: should not credit balance if withdrawal is already REVERSED', async () => {
      const mockWithdrawal: any = {
        id: 10,
        userId: 5,
        amount: 50000,
        payoutId: 'pout_already_reversed',
        status: WithdrawalStatus.REVERSED, // Already reversed!
      };

      mockWithdrawalRepo.findOne.mockResolvedValue(mockWithdrawal);

      const res = await walletService.handlePayoutReversed(10, 'Duplicate webhook');

      expect(res?.status).toBe(WithdrawalStatus.REVERSED);
      // Wallet balance update must NOT have been called
      expect(mockWalletRepo.update).not.toHaveBeenCalled();
      expect(mockTxnRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('Payout Completed Status Update', () => {
    it('should mark withdrawal COMPLETED and keep payoutId intact without erasing it', async () => {
      const mockWithdrawal: any = {
        id: 12,
        userId: 5,
        amount: 30000,
        payoutId: 'pout_proc_789',
        status: WithdrawalStatus.APPROVED,
      };

      mockWithdrawalRepo.findOne.mockResolvedValue(mockWithdrawal);

      await walletService.handlePayoutProcessed(12, 'pout_proc_789', { utr: 'UTR_BANK_123' });

      expect(mockWithdrawal.status).toBe(WithdrawalStatus.COMPLETED);
      expect(mockWithdrawal.utr).toBe('UTR_BANK_123');
      expect(mockWithdrawal.payoutId).toBe('pout_proc_789'); // Preserved!
      expect(mockWithdrawalRepo.save).toHaveBeenCalledWith(mockWithdrawal);
    });
  });
});
