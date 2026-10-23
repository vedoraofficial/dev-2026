import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Wallet } from './entity/wallet.entity';
import { WalletTransaction, TransactionType, TransactionCategory } from './entity/wallet-transaction.entity';
import { Withdrawal, WithdrawalStatus } from './entity/withdrawal.entity';
import { UserBank, BankVerificationStatus } from '../user/entity/user-bank.entity';
import { WalletTransactionsQueryDto } from './dto/wallet-transactions-query.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';
import { MailService } from '../notification/mail.service';
import { RazorpayPayoutService } from '../payout/razorpay-payout.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

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
    private readonly notificationService: NotificationService,
    private readonly razorpayPayoutService: RazorpayPayoutService,
    private readonly mailService?: MailService,
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

    const runInTransaction = async (txManager: EntityManager): Promise<WalletTransaction> => {
      const walletRepo = txManager.getRepository(Wallet);
      const txnRepo = txManager.getRepository(WalletTransaction);

      // Lock wallet row for update
      let wallet = await walletRepo
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', { userId })
        .getOne();

      if (!wallet) {
        wallet = await this.createWallet(userId, txManager);
      }

      // Update balance - only legitimate commission earnings increment totalEarned
      // Topups (capital deposited) and refunds (returned order payments) do not inflate earned income
      const isEarning = [
        TransactionCategory.COMMISSION_DIRECT,
        TransactionCategory.COMMISSION_LEVEL_1,
        TransactionCategory.COMMISSION_LEVEL_2,
        TransactionCategory.COMMISSION_LEVEL_3,
        TransactionCategory.COMMISSION_LEVEL_4,
        TransactionCategory.COMMISSION_LEVEL_5,
      ].includes(category);

      const newAvailable = Number(wallet.availableBalance) + amount;
      const newTotalEarned = isEarning
        ? Number(wallet.totalEarned) + amount
        : Number(wallet.totalEarned);

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

    const currentLocked = Number(wallet.lockedBalance);
    if (currentLocked < amount) {
      throw new BadRequestException('Locked balance is less than unlock amount.');
    }

    await walletRepo.update(wallet.id, {
      availableBalance: Number(wallet.availableBalance) + amount,
      lockedBalance: currentLocked - amount,
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

    const currentLocked = Number(wallet.lockedBalance);
    if (currentLocked < amount) {
      throw new BadRequestException('Locked balance is less than withdrawal amount.');
    }

    await walletRepo.update(wallet.id, {
      lockedBalance: currentLocked - amount,
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

      // In-app Notification: WITHDRAWAL_REQUESTED (to partner)
      const bankMasked = `${bank.bankName} (****${bank.accountNumber.slice(-4)})`;
      const formattedAmount = this.formatPaise(amountInPaise);
      await this.notificationService.create(
        userId,
        NotificationKey.WITHDRAWAL_REQUESTED,
        `Withdrawal of ${formattedAmount} requested`,
        `Request #${withdrawal.id} to ${bankMasked} received. Held as pending payout until Admin reviews it.`,
        { withdrawalId: Number(withdrawal.id), amountPaise: amountInPaise },
        manager,
      );

      // In-app Notification: ADMIN_WITHDRAWAL_PENDING (to all Admins)
      const pendingWithdrawals = await manager.getRepository(Withdrawal).find({
        where: { status: WithdrawalStatus.PENDING },
      });
      const pendingCount = pendingWithdrawals.length;
      const pendingTotalPaise = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
      const partner = bank.user;
      await this.notificationService.notifyAllAdmins(
        NotificationKey.ADMIN_WITHDRAWAL_PENDING,
        `${pendingCount} withdrawal request${pendingCount === 1 ? '' : 's'} pending`,
        `${partner?.name || 'Partner'} (${partner?.vedId || 'VED'}) requested ${formattedAmount}. Total pending: ${this.formatPaise(pendingTotalPaise)}.`,
        { pendingCount, pendingTotalPaise, latestWithdrawalId: Number(withdrawal.id) },
        manager,
      );

      if (this.mailService && bank.user?.email) {
        this.mailService
          .sendWithdrawalRequestedEmail(bank.user.email, {
            name: bank.user.name,
            vedId: bank.user.vedId,
            withdrawalId: Number(withdrawal.id),
            amountFormatted: formattedAmount,
            bankMasked,
          })
          .catch(() => {});
      }

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
        relations: { bank: true, user: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!withdrawal) throw new NotFoundException('Withdrawal not found.');
      if (withdrawal.status !== WithdrawalStatus.PENDING) {
        throw new ConflictException(`Withdrawal is already ${withdrawal.status}.`);
      }

      if (!withdrawal.bank) {
        throw new BadRequestException('Withdrawal has no bank details associated.');
      }

      // Execute Payout Transfer via RazorpayX
      const payoutResult = await this.razorpayPayoutService.executePayout({
        withdrawalId: Number(withdrawal.id),
        amountPaise: Number(withdrawal.amount),
        accountNumber: withdrawal.bank.accountNumber,
        ifscCode: withdrawal.bank.ifscCode,
        accountHolderName: withdrawal.bank.accountHolderName,
        phone: withdrawal.user?.mobile,
        email: withdrawal.user?.email,
      });

      if (!payoutResult.success) {
        throw new BadRequestException(`Payout failed: ${payoutResult.remarks}`);
      }

      // Update status & record payout remarks
      withdrawal.status = WithdrawalStatus.APPROVED;
      withdrawal.adminUserId = adminUserId;
      withdrawal.adminRemarks = payoutResult.remarks;
      withdrawal.processedAt = new Date();
      await withdrawalRepo.save(withdrawal);

      // Confirm: deduct from locked, add to total_withdrawn
      await this.confirmWithdrawal(withdrawal.userId, Number(withdrawal.amount), manager);

      // In-app Notification: WITHDRAWAL_APPROVED (to partner)
      const bankMasked = withdrawal.bank
        ? `${withdrawal.bank.bankName} (****${withdrawal.bank.accountNumber.slice(-4)})`
        : 'bank account';
      const formattedAmount = this.formatPaise(withdrawal.amount);
      const utrNote = payoutResult.utr ? ` UTR: ${payoutResult.utr}.` : '';
      await this.notificationService.create(
        withdrawal.userId,
        NotificationKey.WITHDRAWAL_APPROVED,
        `Withdrawal #${withdrawal.id} approved`,
        `${formattedAmount} will be credited to ${bankMasked} within 24 hours.${utrNote}`,
        { withdrawalId: Number(withdrawal.id), amountPaise: Number(withdrawal.amount), utr: payoutResult.utr },
        manager,
      );

      if (this.mailService && withdrawal.user?.email) {
        this.mailService
          .sendPayoutDisbursedEmail(withdrawal.user.email, {
            name: withdrawal.user.name,
            vedId: withdrawal.user.vedId,
            withdrawalId: Number(withdrawal.id),
            amountFormatted: formattedAmount,
            bankMasked,
            utr: payoutResult.utr,
          })
          .catch(() => {});
      }

      return {
        message: 'Withdrawal approved and payout transfer initiated successfully.',
        withdrawal: {
          id: Number(withdrawal.id),
          amountFormatted: this.formatPaise(withdrawal.amount),
          status: withdrawal.status,
          utr: payoutResult.utr,
          referenceId: payoutResult.referenceId,
          remarks: payoutResult.remarks,
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
        lock: { mode: 'pessimistic_write' },
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

      // In-app Notification: WITHDRAWAL_REJECTED (to partner)
      const formattedAmount = this.formatPaise(withdrawal.amount);
      await this.notificationService.create(
        withdrawal.userId,
        NotificationKey.WITHDRAWAL_REJECTED,
        `Withdrawal #${withdrawal.id} rejected`,
        `Your request for ${formattedAmount} was rejected. Reason: ${remarks || 'Administrative review'}. The amount is back in your balance.`,
        { withdrawalId: Number(withdrawal.id), amountPaise: Number(withdrawal.amount), remarks: remarks || null },
        manager,
      );

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

  // ─── RazorpayX Payout Reversal & Status Synchronization ─────────────

  /**
   * Called when RazorpayX marks a payout as reversed or failed.
   * Credits the amount back to partner's available balance,
   * decrements totalWithdrawn, records a WITHDRAWAL_REVERSAL transaction,
   * and updates withdrawal status to REVERSED.
   */
  async handlePayoutReversed(withdrawalId: number, reason?: string, rawPayoutData?: any) {
    return this.dataSource.transaction(async (manager) => {
      const withdrawalRepo = manager.getRepository(Withdrawal);
      const withdrawal = await withdrawalRepo.findOne({
        where: { id: withdrawalId },
        relations: { user: true, bank: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!withdrawal) {
        this.logger.warn(`Withdrawal #${withdrawalId} not found for reversal`);
        return null;
      }

      // Idempotency: If already REVERSED, do not credit twice
      if (withdrawal.status === WithdrawalStatus.REVERSED) {
        this.logger.log(`Withdrawal #${withdrawalId} is already REVERSED. Skipping.`);
        return withdrawal;
      }

      const amount = Number(withdrawal.amount);

      // Fetch partner wallet with write lock
      const walletRepo = manager.getRepository(Wallet);
      const wallet = await walletRepo
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', { userId: withdrawal.userId })
        .getOne();

      if (!wallet) {
        this.logger.error(`Wallet for user ${withdrawal.userId} not found during withdrawal reversal`);
        return null;
      }

      // Credit amount back to available balance and decrement totalWithdrawn
      const currentAvailable = Number(wallet.availableBalance);
      const currentWithdrawn = Number(wallet.totalWithdrawn);
      const newAvailable = currentAvailable + amount;
      const newWithdrawn = Math.max(0, currentWithdrawn - amount);

      await walletRepo.update(wallet.id, {
        availableBalance: newAvailable,
        totalWithdrawn: newWithdrawn,
      });

      // Update withdrawal record
      const failureReason = reason || rawPayoutData?.failure_reason || 'Reversed by bank/Razorpay';
      withdrawal.status = WithdrawalStatus.REVERSED;
      withdrawal.adminRemarks = `RazorpayX Payout Reversed. Reason: ${failureReason}`;
      withdrawal.processedAt = new Date();
      await withdrawalRepo.save(withdrawal);

      // Record WITHDRAWAL_REVERSAL transaction
      const txnRepo = manager.getRepository(WalletTransaction);
      const txn = txnRepo.create({
        walletId: wallet.id,
        type: TransactionType.CREDIT,
        category: TransactionCategory.WITHDRAWAL_REVERSAL,
        amount,
        balanceAfter: newAvailable,
        referenceType: 'WITHDRAWAL',
        referenceId: String(withdrawal.id),
        description: `Withdrawal #${withdrawal.id} payout reversed (${failureReason}). ${this.formatPaise(amount)} credited back to wallet.`,
      });
      await txnRepo.save(txn);

      // In-app Notification to partner
      await this.notificationService.create(
        withdrawal.userId,
        NotificationKey.WITHDRAWAL_REJECTED,
        `Withdrawal #${withdrawal.id} reversed`,
        `Your payout of ${this.formatPaise(amount)} was reversed (${failureReason}). The amount has been credited back to your wallet.`,
        { withdrawalId: Number(withdrawal.id), amountPaise: amount, reason: failureReason },
        manager,
      );

      this.logger.log(
        `[Withdrawal Reversal] Withdrawal #${withdrawal.id} reversed. ₹${amount / 100} credited back to user #${withdrawal.userId}. Available: ₹${newAvailable / 100}`,
      );

      return withdrawal;
    });
  }

  /**
   * Called when RazorpayX marks a payout as processed / settled by bank.
   */
  async handlePayoutProcessed(withdrawalId: number | null, payoutId: string, rawPayoutData?: any) {
    let withdrawal: Withdrawal | null = null;
    if (withdrawalId) {
      withdrawal = await this.withdrawalRepo.findOne({ where: { id: withdrawalId } });
    }
    if (!withdrawal && payoutId) {
      withdrawal = await this.withdrawalRepo
        .createQueryBuilder('w')
        .where('w.adminRemarks LIKE :pat', { pat: `%${payoutId}%` })
        .getOne();
    }

    if (!withdrawal) {
      this.logger.warn(`Withdrawal not found for payout ${payoutId}`);
      return null;
    }

    if (withdrawal.status !== WithdrawalStatus.COMPLETED) {
      withdrawal.status = WithdrawalStatus.COMPLETED;
      const utr = rawPayoutData?.utr || payoutId;
      withdrawal.adminRemarks = `RazorpayX Payout Completed. UTR: ${utr}`;
      await this.withdrawalRepo.save(withdrawal);
      this.logger.log(`Withdrawal #${withdrawal.id} marked COMPLETED (UTR: ${utr})`);
    }

    return withdrawal;
  }

  /**
   * Helper to handle payout reversal lookup by payoutId or withdrawalId.
   */
  async handlePayoutReversalByPayoutIdOrId(
    withdrawalId: number | null,
    payoutId: string,
    reason?: string,
    rawPayoutData?: any,
  ) {
    let withdrawal: Withdrawal | null = null;
    if (withdrawalId) {
      withdrawal = await this.withdrawalRepo.findOne({ where: { id: withdrawalId } });
    }
    if (!withdrawal && payoutId) {
      withdrawal = await this.withdrawalRepo
        .createQueryBuilder('w')
        .where('w.adminRemarks LIKE :pat', { pat: `%${payoutId}%` })
        .getOne();
    }

    if (!withdrawal) {
      this.logger.warn(`Could not find withdrawal matching payout ${payoutId} / #${withdrawalId} for reversal`);
      return null;
    }

    return this.handlePayoutReversed(Number(withdrawal.id), reason, rawPayoutData);
  }

  /**
   * Admin: Synchronize status of a specific withdrawal payout with RazorpayX
   */
  async syncWithdrawalPayout(withdrawalId: number) {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id: withdrawalId },
      relations: { bank: true, user: true },
    });

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal #${withdrawalId} not found.`);
    }

    // Extract payoutId from adminRemarks (e.g. pout_TqWONYb8P01onW)
    const match = withdrawal.adminRemarks?.match(/pout_[a-zA-Z0-9]+/);
    const payoutId = match ? match[0] : null;

    if (!payoutId) {
      throw new BadRequestException(
        `Withdrawal #${withdrawalId} does not have a RazorpayX Payout ID in its records.`,
      );
    }

    const payoutData = await this.razorpayPayoutService.getPayoutStatus(payoutId);

    if (!payoutData?.id) {
      throw new BadRequestException(
        `Razorpay error: ${payoutData?.error?.description || 'Failed to fetch status'}`,
      );
    }

    const status = payoutData.status; // 'processed' | 'reversed' | 'failed' | 'rejected' | 'processing' | 'queued'

    if (status === 'reversed' || status === 'failed' || status === 'rejected') {
      const reason = payoutData.failure_reason || payoutData.status_details?.description || 'Reversed by bank';
      const reversed = await this.handlePayoutReversed(withdrawalId, reason, payoutData);
      return {
        synced: true,
        payoutId,
        razorpayStatus: status,
        actionTaken: 'REVERSED',
        message: `Payout was ${status} on Razorpay. ${this.formatPaise(withdrawal.amount)} has been credited back to the user's wallet.`,
        withdrawal: reversed,
      };
    } else if (status === 'processed') {
      withdrawal.status = WithdrawalStatus.COMPLETED;
      withdrawal.adminRemarks = `RazorpayX Payout Completed. UTR: ${payoutData.utr || payoutId}`;
      await this.withdrawalRepo.save(withdrawal);
      return {
        synced: true,
        payoutId,
        razorpayStatus: status,
        actionTaken: 'COMPLETED',
        message: `Payout was processed successfully on Razorpay. Withdrawal marked COMPLETED.`,
        withdrawal,
      };
    }

    return {
      synced: true,
      payoutId,
      razorpayStatus: status,
      actionTaken: 'NO_CHANGE',
      message: `Razorpay payout status is currently "${status}".`,
      withdrawal,
    };
  }

  /**
   * Admin: Synchronize all APPROVED / PROCESSING withdrawals with RazorpayX
   */
  async syncAllActiveWithdrawals() {
    const activeWithdrawals = await this.withdrawalRepo
      .createQueryBuilder('w')
      .where('w.status IN (:...statuses)', { statuses: [WithdrawalStatus.APPROVED, WithdrawalStatus.PROCESSING] })
      .andWhere("w.adminRemarks LIKE '%pout_%'")
      .getMany();

    const results = [];
    for (const w of activeWithdrawals) {
      try {
        const res = await this.syncWithdrawalPayout(Number(w.id));
        results.push({ id: Number(w.id), ...res });
      } catch (err: any) {
        results.push({ id: Number(w.id), error: err.message });
      }
    }

    return {
      totalChecked: activeWithdrawals.length,
      results,
    };
  }
}
