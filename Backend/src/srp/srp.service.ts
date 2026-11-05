import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SrpWallet } from './entity/srp-wallet.entity';
import { SrpLedger, SrpReason, SrpTransactionType } from './entity/srp-ledger.entity';
import { User, UserRole, UserStatus } from '../user/entity/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';

/** 10 SRP = 1 month of free ID activation when a partner makes no sale in a month. */
const MONTHLY_AUTO_DEDUCT_AMOUNT = 10;

@Injectable()
export class SrpService {
  private readonly logger = new Logger(SrpService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SrpWallet)
    private readonly srpWalletRepo: Repository<SrpWallet>,
    @InjectRepository(SrpLedger)
    private readonly srpLedgerRepo: Repository<SrpLedger>,
    private readonly notificationService: NotificationService,
  ) {}

  async ensureWallet(userId: number, manager?: EntityManager): Promise<SrpWallet> {
    const repo = manager ? manager.getRepository(SrpWallet) : this.srpWalletRepo;
    const existing = await repo.findOne({ where: { userId } });
    if (existing) return existing;
    return repo.save(repo.create({ userId }));
  }

  /** Credits SRP into `userId`'s wallet and records the ledger entry. Always inside the caller's transaction when `manager` is passed. */
  async credit(
    userId: number,
    amount: number,
    reason: SrpReason,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
    description?: string,
  ): Promise<SrpLedger> {
    const walletRepo = manager.getRepository(SrpWallet);
    const ledgerRepo = manager.getRepository(SrpLedger);

    let wallet = await walletRepo
      .createQueryBuilder('wallet')
      .setLock('pessimistic_write')
      .where('wallet.user_id = :userId', { userId })
      .getOne();
    if (!wallet) {
      wallet = await this.ensureWallet(userId, manager);
    }

    const newBalance = wallet.balance + amount;
    await walletRepo.update(wallet.id, {
      balance: newBalance,
      totalEarned: wallet.totalEarned + amount,
    });

    return ledgerRepo.save(
      ledgerRepo.create({
        userId,
        type: SrpTransactionType.EARN,
        reason,
        amount,
        balanceAfter: newBalance,
        referenceType,
        referenceId,
        description: description ?? null,
      }),
    );
  }

  async getSummary(userId: number) {
    const wallet = await this.ensureWallet(userId);
    return {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalRedeemed: wallet.totalRedeemed,
      monthsRedeemable: Math.floor(wallet.balance / MONTHLY_AUTO_DEDUCT_AMOUNT),
    };
  }

  async getLedger(userId: number, limit = 200) {
    const rows = await this.srpLedgerRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return rows.map((r) => ({
      id: Number(r.id),
      type: r.type,
      reason: r.reason,
      amount: r.amount,
      balanceAfter: r.balanceAfter,
      referenceType: r.referenceType,
      referenceId: r.referenceId,
      description: r.description,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Runs at 01:00 on the 1st of every month — checks the PREVIOUS month for every ACTIVE partner:
   * no sale (no SRP earned) and balance ≥ 10 → auto-deduct 10 SRP, stay active;
   * no sale and balance < 10 → ID goes INACTIVE.
   * Partners with at least one sale that month are left untouched.
   */
  @Cron('0 1 1 * *') // 01:00 on the 1st of every month
  async runMonthlyCheck(): Promise<{ checked: number; deducted: number; deactivated: number }> {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return this.checkMonth(monthStart, monthEnd);
  }

  /** Extracted so it can be exercised for a specific window (admin "run now" / tests). */
  async checkMonth(monthStart: Date, monthEnd: Date) {
    const userRepo = this.dataSource.getRepository(User);
    const partners = await userRepo.find({ where: { role: UserRole.PARTNER, status: UserStatus.ACTIVE } });

    const soldThisMonth: { user_id: number }[] = await this.dataSource.query(
      `SELECT DISTINCT user_id FROM srp_ledger
       WHERE type = 'EARN' AND created_at >= $1 AND created_at < $2`,
      [monthStart, monthEnd],
    );
    const soldUserIds = new Set(soldThisMonth.map((r) => Number(r.user_id)));

    let deducted = 0;
    let deactivated = 0;

    for (const partner of partners) {
      if (soldUserIds.has(partner.id)) continue;

      await this.dataSource.transaction(async (manager) => {
        const wallet = await this.ensureWallet(partner.id, manager);

        if (wallet.balance >= MONTHLY_AUTO_DEDUCT_AMOUNT) {
          const newBalance = wallet.balance - MONTHLY_AUTO_DEDUCT_AMOUNT;
          await manager.getRepository(SrpWallet).update(wallet.id, {
            balance: newBalance,
            totalRedeemed: wallet.totalRedeemed + MONTHLY_AUTO_DEDUCT_AMOUNT,
          });
          await manager.getRepository(SrpLedger).save(
            manager.getRepository(SrpLedger).create({
              userId: partner.id,
              type: SrpTransactionType.DEDUCT,
              reason: SrpReason.MONTHLY_AUTO_DEDUCT,
              amount: MONTHLY_AUTO_DEDUCT_AMOUNT,
              balanceAfter: newBalance,
              description: 'No sale this month — 10 SRP auto-deducted to keep your ID active.',
            }),
          );
          await this.notificationService.create(
            partner.id,
            NotificationKey.SRP_AUTO_DEDUCTED,
            '10 SRP deducted to keep your ID active',
            `You made no sale last month. 10 SRP was deducted from your SRP wallet (balance: ${newBalance}) to keep ${partner.vedId} active.`,
            { deductedAmount: MONTHLY_AUTO_DEDUCT_AMOUNT, balanceAfter: newBalance },
            manager,
          );
          deducted++;
        } else {
          await manager.getRepository(User).update(partner.id, { status: UserStatus.INACTIVE });
          await this.notificationService.create(
            partner.id,
            NotificationKey.SRP_ID_DEACTIVATED,
            'Your VEDORA ID is now inactive',
            `You made no sale last month and had fewer than ${MONTHLY_AUTO_DEDUCT_AMOUNT} SRP (balance: ${wallet.balance}), so ${partner.vedId} is now inactive. Make a sale to reactivate.`,
            { balance: wallet.balance },
            manager,
          );
          deactivated++;
        }
      });
    }

    this.logger.log(
      `SRP monthly check (${monthStart.toISOString().slice(0, 7)}): ${partners.length} active partners, ${deducted} auto-deducted, ${deactivated} deactivated.`,
    );
    return { checked: partners.length, deducted, deactivated };
  }

  /** [Admin] Manually trigger the check for a given month (defaults to last month) — for testing/ops. */
  async runMonthlyCheckForMonth(year?: number, month?: number) {
    if ((year === undefined) !== (month === undefined)) {
      throw new BadRequestException('Provide both year and month, or neither.');
    }
    const now = new Date();
    const y = year ?? now.getUTCFullYear();
    const m = month !== undefined ? month - 1 : now.getUTCMonth() - 1;
    const monthStart = new Date(Date.UTC(y, m, 1));
    const monthEnd = new Date(Date.UTC(y, m + 1, 1));
    return this.checkMonth(monthStart, monthEnd);
  }
}
