import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

export enum SrpTransactionType {
  EARN = 'EARN',
  DEDUCT = 'DEDUCT',
}

export enum SrpReason {
  /** A partner this user sponsored paid their joining order and activated */
  PARTNER_JOIN_SALE = 'PARTNER_JOIN_SALE',
  /** This user bought a product for themselves (any order after their own ID is active) */
  SELF_PURCHASE = 'SELF_PURCHASE',
  /** No sale in the month — 10 SRP auto-deducted to keep the ID active */
  MONTHLY_AUTO_DEDUCT = 'MONTHLY_AUTO_DEDUCT',
}

@Entity('srp_ledger')
export class SrpLedger {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  type: SrpTransactionType;

  @Column({ type: 'varchar', length: 30 })
  reason: SrpReason;

  /** Always positive — `type` says whether it was added or removed */
  @Column({ type: 'int' })
  amount: number;

  /** Snapshot of the wallet's balance AFTER this entry */
  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;

  @Column({ name: 'reference_type', type: 'varchar', length: 30, nullable: true })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
  referenceId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;
}
