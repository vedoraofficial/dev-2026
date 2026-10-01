import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Wallet } from './entity/wallet.entity';
import { WalletTransaction, TransactionType, TransactionCategory } from './entity/wallet-transaction.entity';
import { Withdrawal, WithdrawalStatus } from './entity/withdrawal.entity';
import { UserBank, BankVerificationStatus } from '../user/entity/user-bank.entity';
import { WalletTransactionsQueryDto } from './dto/wallet-transactions-query.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly txnRepo: Repository<WalletTransaction>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(UserBank)
    private readonly bankRepo: Repository<UserBank>,
  ) {}

  // ─── Helper: Convert paise to formatted rupee string ────────────────
  private formatPaise(paise: number): string {
    const rupees = Number(paise) / 100;
    return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // ─── Wallet Creation ────────────────────────────────────────────────
  /**
   * Create a wallet for a user. Can be called inside an existing transaction
   * by passing the EntityManager, or standalone.
   */
  async createWallet(userId: number, manager?: EntityManager): Promise<Wallet> {
    const repo = manager ? manager.getRepository(Wallet) : this.walletRepo;

    // Check if wallet already exists
    const existing = await repo.findOne({ where: { userId } });
    if (existing) return existing;

    const wallet = repo.create({ userId });
    return repo.save(wallet);
  }

  // ─── Wallet Retrieval ───────────────────────────────────────────────
  async getWalletByUserId(userId: number): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user.');
    }
    return wallet;
  }

  async getWalletSummary(userId: number) {
    const wallet = await this.getWalletByUserId(userId);
    return {
      id: wallet.id,
      availableBalance: Number(wallet.availableBalance),
      availableBalanceFormatted: this.formatPaise(wallet.availableBalance),
      lockedBalance: Number(wallet.lockedBalance),
      lockedBalanceFormatted: this.formatPaise(wallet.lockedBalance),
      totalEarned: Number(wallet.totalEarned),
      totalEarnedFormatted: this.formatPaise(wallet.totalEarned),
      totalWithdrawn: Number(wallet.totalWithdrawn),
      totalWithdrawnFormatted: this.formatPaise(wallet.totalWithdrawn),
    };
  }

  // ─── Credit ─────────────────────────────────────────────────────────
  /**
   * Credit money INTO the wallet (commissions, refunds, admin adjustments).
   * Uses pessimistic lock to prevent race conditions.
   */
  async credit(
    userId: number,
    amount: number,
    category: TransactionCategory,
    description: string,
    referenceType?: string,
    referenceId?: string,
    manager?: EntityManager,
  ): Promise<WalletTransaction> {
    if (amount <= 0) throw new BadRequestException('Credit amount must be positive.');

    const em = manager || this.dataSource.manager;

    const runInTransaction = async (txManager: EntityManager): Promise<WalletTransaction> => {
      const walletRepo = txManager.getRepository(Wallet);
      const txnRepo = txManager.getRepository(WalletTransaction);

      // Lock wallet row for update
      const wallet = await walletRepo
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', { userId })
        .getOne();

      if (!wallet) throw new NotFoundException('Wallet not found.');

      // Update balance
      const newAvailable = Number(wallet.availableBalance) + amount;
      const newTotalEarned = Number(wallet.totalEarned) + amount;

      await walletRepo.update(wallet.id, {
        availableBalance: newAvailable,
        totalEarned: newTotalEarned,
      });

      // Create transaction record
      const txn = txnRepo.create({
        walletId: wallet.id,
        type: TransactionType.CREDIT,
        category,
        amount,
        balanceAfter: newAvailable,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        description,
      });

      return txnRepo.save(txn);
    };

    // If we already have a manager (inside a transaction), use it directly
    if (manager) {
      return runInTransaction(manager);
    }

    // Otherwise, wrap in a new transaction
    return this.dataSource.transaction(runInTransaction);
  }

  // ─── Debit ──────────────────────────────────────────────────────────
  /**
   * Debit money FROM the wallet (purchases, etc.).
   * Validates sufficient available balance.
   */
  async debit(
    userId: number,
    amount: number,
    category: TransactionCategory,
    description: string,
    referenceType?: string,
    referenceId?: string,
    manager?: EntityManager,
  ): Promise<WalletTransaction> {
    if (amount <= 0) throw new BadRequestException('Debit amount must be positive.');

    const runInTransaction = async (txManager: EntityManager): Promise<WalletTransaction> => {
      const walletRepo = txManager.getRepository(Wallet);
      const txnRepo = txManager.getRepository(WalletTransaction);

      const wallet = await walletRepo
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', { userId })
        .getOne();

      if (!wallet) throw new NotFoundException('Wallet not found.');

      const currentAvailable = Number(wallet.availableBalance);
      if (currentAvailable < amount) {
        throw new BadRequestException(
          `Insufficient wallet balance. Available: ${this.formatPaise(currentAvailable)}, Required: ${this.formatPaise(amount)}`,
        );
      }

      const newAvailable = currentAvailable - amount;
      await walletRepo.update(wallet.id, { availableBalance: newAvailable });

      const txn = txnRepo.create({
        walletId: wallet.id,
        type: TransactionType.DEBIT,
        category,
        amount,
        balanceAfter: newAvailable,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        description,
      });

      return txnRepo.save(txn);
    };

    if (manager) {
      return runInTransaction(manager);
    }
    return this.dataSource.transaction(runInTransaction);
  }

  // ─── Lock/Unlock Balance (Withdrawal Flow) ─────────────────────────

  /** Move amount from available → locked (when withdrawal requested) */
  async lockBalance(userId: number, amount: number, manager: EntityManager): Promise<void> {
    const walletRepo = manager.getRepository(Wallet);

    const wallet = await walletRepo
      .createQueryBuilder('wallet')
      .setLock('pessimistic_write')
      .where('wallet.user_id = :userId', { userId })
      .getOne();

    if (!wallet) throw new NotFoundException('Wallet not found.');

    const available = Number(wallet.availableBalance);
    if (available < amount) {
      throw new BadRequestException('Insufficient available balance for withdrawal.');
    }

    await walletRepo.update(wallet.id, {
      availableBalance: available - amount,
      lockedBalance: Number(wallet.lockedBalance) + amount,
    });
  }

  /** Move amount from locked → available (when withdrawal rejected) */
  async unlockBalance(userId: number, amount: number, manager: EntityManager): Promise<void> {
    const walletRepo = manager.getRepository(Wallet);

    const wallet = await walletRepo
      .createQueryBuilder('wallet')
      .setLock('pessimistic_write')
      .where('wallet.user_id = :userId', { userId })
      .getOne();

    if (!wallet) throw new NotFoundException('Wallet not found.');

    await walletRepo.update(wallet.id, {
      availableBalance: Number(wallet.availableBalance) + amount,
      lockedBalance: Number(wallet.lockedBalance) - amount,
    });
  }

  /** Confirm withdrawal: deduct from locked, add to total_withdrawn */
  async confirmWithdrawal(userId: number, amount: number, manager: EntityManager): Promise<void> {
    const walletRepo = manager.getRepository(Wallet);

    const wallet = await walletRepo
      .createQueryBuilder('wallet')
      .setLock('pessimistic_write')
      .where('wallet.user_id = :userId', { userId })
      .getOne();

    if (!wallet) throw new NotFoundException('Wallet not found.');

    await walletRepo.update(wallet.id, {
      lockedBalance: Number(wallet.lockedBalance) - amount,
      totalWithdrawn: Number(wallet.totalWithdrawn) + amount,
    });
  }

  // ─── Transaction History ────────────────────────────────────────────

  async getTransactions(userId: number, query: WalletTransactionsQueryDto) {
    const wallet = await this.getWalletByUserId(userId);

    const qb = this.txnRepo
      .createQueryBuilder('txn')
      .where('txn.wallet_id = :walletId', { walletId: wallet.id });

    if (query.type) {
      qb.andWhere('txn.type = :type', { type: query.type });
    }
    if (query.category) {
      qb.andWhere('txn.category = :category', { category: query.category });
    }
    if (query.fromDate) {
      qb.andWhere('txn.created_at >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      qb.andWhere('txn.created_at <= :toDate', { toDate: query.toDate });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    qb.orderBy('txn.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((txn) => ({
        id: Number(txn.id),
        type: txn.type,
        category: txn.category,
        amount: Number(txn.amount),
        amountFormatted: this.formatPaise(txn.amount),
        balanceAfter: Number(txn.balanceAfter),
        balanceAfterFormatted: this.formatPaise(txn.balanceAfter),
        referenceType: txn.referenceType,
        referenceId: txn.referenceId,
        description: txn.description,
        createdAt: txn.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Withdrawal Request ─────────────────────────────────────────────

  /**
   * Partner requests a withdrawal to their verified bank account.
   * Locks the amount from available balance.
   */
  async requestWithdrawal(userId: number, amountInRupees: number, bankId: number) {
    if (amountInRupees < 100) {
      throw new BadRequestException('Minimum withdrawal amount is ₹100.');
    }

    const amountInPaise = amountInRupees * 100;

    return this.dataSource.transaction(async (manager) => {
      // Validate bank belongs to user and is VERIFIED
      const bank = await manager.getRepository(UserBank).findOne({
        where: { id: bankId },
        relations: { user: true },
      });

      if (!bank || bank.user.id !== userId) {
        throw new NotFoundException('Bank account not found.');
      }

      if (bank.verificationStatus !== BankVerificationStatus.VERIFIED) {
        throw new BadRequestException('Withdrawal is only allowed to verified bank accounts.');
      }

      // Lock balance
      await this.lockBalance(userId, amountInPaise, manager);

      // Create withdrawal record
      const withdrawalRepo = manager.getRepository(Withdrawal);
      const withdrawal = withdrawalRepo.create({
        userId,
        bankId,
        amount: amountInPaise,
        status: WithdrawalStatus.PENDING,
      });
      await withdrawalRepo.save(withdrawal);

      // Record debit transaction (balance moved from available to locked)
      const walletRepo = manager.getRepository(Wallet);
      const wallet = await walletRepo.findOne({ where: { userId } });
      const txnRepo = manager.getRepository(WalletTransaction);
      const txn = txnRepo.create({
        walletId: wallet!.id,
        type: TransactionType.DEBIT,
        category: TransactionCategory.WITHDRAWAL,
        amount: amountInPaise,
        balanceAfter: Number(wallet!.availableBalance),
        referenceType: 'WITHDRAWAL',
        referenceId: String(withdrawal.id),
        description: `Withdrawal request of ${this.formatPaise(amountInPaise)} to ${bank.bankName} (****${bank.accountNumber.slice(-4)})`,
      });
      await txnRepo.save(txn);

      return {
        message: 'Withdrawal request submitted successfully.',
        withdrawal: {
          id: Number(withdrawal.id),
          amount: amountInRupees,
          amountFormatted: this.formatPaise(amountInPaise),
          status: withdrawal.status,
          bank: {
            bankName: bank.bankName,
            accountNumber: `****${bank.accountNumber.slice(-4)}`,
            ifscCode: bank.ifscCode,
          },
          createdAt: withdrawal.createdAt,
        },
      };
    });
  }

  // ─── Admin: Approve Withdrawal ──────────────────────────────────────

  async approveWithdrawal(withdrawalId: number, adminUserId: number) {
    return this.dataSource.transaction(async (manager) => {
      const withdrawalRepo = manager.getRepository(Withdrawal);

      const withdrawal = await withdrawalRepo.findOne({
        where: { id: withdrawalId },
      });

      if (!withdrawal) throw new NotFoundException('Withdrawal not found.');
      if (withdrawal.status !== WithdrawalStatus.PENDING) {
        throw new ConflictException(`Withdrawal is already ${withdrawal.status}.`);
      }

      // Update status
      withdrawal.status = WithdrawalStatus.APPROVED;
      withdrawal.adminUserId = adminUserId;
      withdrawal.processedAt = new Date();
      await withdrawalRepo.save(withdrawal);

      // Confirm: deduct from locked, add to total_withdrawn
      await this.confirmWithdrawal(withdrawal.userId, Number(withdrawal.amount), manager);

      return {
        message: 'Withdrawal approved successfully.',
        withdrawal: {
          id: Number(withdrawal.id),
          amountFormatted: this.formatPaise(withdrawal.amount),
          status: withdrawal.status,
        },
      };
    });
  }

  // ─── Admin: Reject Withdrawal ───────────────────────────────────────

  async rejectWithdrawal(withdrawalId: number, adminUserId: number, remarks?: string) {
    return this.dataSource.transaction(async (manager) => {
      const withdrawalRepo = manager.getRepository(Withdrawal);

      const withdrawal = await withdrawalRepo.findOne({
        where: { id: withdrawalId },
      });

      if (!withdrawal) throw new NotFoundException('Withdrawal not found.');
      if (withdrawal.status !== WithdrawalStatus.PENDING) {
        throw new ConflictException(`Withdrawal is already ${withdrawal.status}.`);
      }

      // Update status
      withdrawal.status = WithdrawalStatus.REJECTED;
      withdrawal.adminUserId = adminUserId;
      withdrawal.adminRemarks = remarks || null;
      withdrawal.processedAt = new Date();
      await withdrawalRepo.save(withdrawal);

      // Unlock: move back from locked → available
      await this.unlockBalance(withdrawal.userId, Number(withdrawal.amount), manager);

      // Record reversal transaction
      const walletRepo = manager.getRepository(Wallet);
      const wallet = await walletRepo.findOne({ where: { userId: withdrawal.userId } });
      const txnRepo = manager.getRepository(WalletTransaction);
      const txn = txnRepo.create({
        walletId: wallet!.id,
        type: TransactionType.CREDIT,
        category: TransactionCategory.WITHDRAWAL_REVERSAL,
        amount: Number(withdrawal.amount),
        balanceAfter: Number(wallet!.availableBalance),
        referenceType: 'WITHDRAWAL',
        referenceId: String(withdrawal.id),
        description: `Withdrawal #${withdrawal.id} rejected${remarks ? ': ' + remarks : ''}`,
      });
      await txnRepo.save(txn);

      return {
        message: 'Withdrawal rejected. Balance has been restored.',
        withdrawal: {
          id: Number(withdrawal.id),
          amountFormatted: this.formatPaise(withdrawal.amount),
          status: withdrawal.status,
          remarks,
        },
      };
    });
  }

  // ─── Get Withdrawals ────────────────────────────────────────────────

  async getMyWithdrawals(userId: number) {
    const withdrawals = await this.withdrawalRepo.find({
      where: { userId },
      relations: { bank: true },
      order: { createdAt: 'DESC' },
    });

    return withdrawals.map((w) => ({
      id: Number(w.id),
      amount: Number(w.amount),
      amountFormatted: this.formatPaise(w.amount),
      status: w.status,
      bank: w.bank
        ? {
            bankName: w.bank.bankName,
            accountNumber: `****${w.bank.accountNumber.slice(-4)}`,
            ifscCode: w.bank.ifscCode,
          }
        : null,
      adminRemarks: w.adminRemarks,
      processedAt: w.processedAt,
      createdAt: w.createdAt,
    }));
  }

  /** Admin: List all withdrawals (optionally filtered by status) */
  async getAllWithdrawals(status?: WithdrawalStatus) {
    const where: any = {};
    if (status) where.status = status;

    const withdrawals = await this.withdrawalRepo.find({
      where,
      relations: { user: true, bank: true, adminUser: true },
      order: { createdAt: 'DESC' },
    });

    return withdrawals.map((w) => ({
      id: Number(w.id),
      amount: Number(w.amount),
      amountFormatted: this.formatPaise(w.amount),
      status: w.status,
      user: {
        id: w.user.id,
        vedId: w.user.vedId,
        name: w.user.name,
      },
      bank: w.bank
        ? {
            id: w.bank.id,
            bankName: w.bank.bankName,
            accountNumber: w.bank.accountNumber,
            ifscCode: w.bank.ifscCode,
          }
        : null,
      adminUser: w.adminUser
        ? { id: w.adminUser.id, vedId: w.adminUser.vedId, name: w.adminUser.name }
        : null,
      adminRemarks: w.adminRemarks,
      processedAt: w.processedAt,
      createdAt: w.createdAt,
    }));
  }
}
