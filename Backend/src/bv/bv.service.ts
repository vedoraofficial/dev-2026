import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BvWallet } from './entity/bv-wallet.entity';
import { BvLedger } from './entity/bv-ledger.entity';

@Injectable()
export class BvService {
  constructor(
    @InjectRepository(BvWallet)
    private readonly bvWalletRepo: Repository<BvWallet>,
    @InjectRepository(BvLedger)
    private readonly bvLedgerRepo: Repository<BvLedger>,
  ) {}

  async ensureWallet(userId: number, manager?: EntityManager): Promise<BvWallet> {
    const repo = manager ? manager.getRepository(BvWallet) : this.bvWalletRepo;
    const existing = await repo.findOne({ where: { userId } });
    if (existing) return existing;
    return repo.save(repo.create({ userId }));
  }

  /** Credits BV points (not money) to `userId` — the sponsor who added `fromUserId`. */
  async credit(
    userId: number,
    amount: number,
    fromUserId: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<BvLedger> {
    const walletRepo = manager.getRepository(BvWallet);
    const ledgerRepo = manager.getRepository(BvLedger);

    let wallet = await walletRepo
      .createQueryBuilder('wallet')
      .setLock('pessimistic_write')
      .where('wallet.user_id = :userId', { userId })
      .getOne();
    if (!wallet) {
      wallet = await this.ensureWallet(userId, manager);
    }

    const newBalance = wallet.balance + amount;
    await walletRepo.update(wallet.id, { balance: newBalance });

    return ledgerRepo.save(
      ledgerRepo.create({
        userId,
        fromUserId,
        amount,
        balanceAfter: newBalance,
        referenceType,
        referenceId,
      }),
    );
  }

  async getSummary(userId: number) {
    const wallet = await this.ensureWallet(userId);
    return { balance: wallet.balance };
  }

  async getLedger(userId: number, limit = 200) {
    const rows = await this.bvLedgerRepo.find({
      where: { userId },
      relations: { fromUser: true },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return rows.map((r) => ({
      id: Number(r.id),
      amount: r.amount,
      balanceAfter: r.balanceAfter,
      fromUser: r.fromUser ? { vedId: r.fromUser.vedId, name: r.fromUser.name } : null,
      referenceType: r.referenceType,
      referenceId: r.referenceId,
      createdAt: r.createdAt,
    }));
  }
}
