import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionCategory {
  COMMISSION_DIRECT = 'COMMISSION_DIRECT',
  COMMISSION_LEVEL_1 = 'COMMISSION_LEVEL_1',
  COMMISSION_LEVEL_2 = 'COMMISSION_LEVEL_2',
  COMMISSION_LEVEL_3 = 'COMMISSION_LEVEL_3',
  COMMISSION_LEVEL_4 = 'COMMISSION_LEVEL_4',
  COMMISSION_LEVEL_5 = 'COMMISSION_LEVEL_5',
  PRODUCT_PURCHASE = 'PRODUCT_PURCHASE',
  WITHDRAWAL = 'WITHDRAWAL',
  WITHDRAWAL_REVERSAL = 'WITHDRAWAL_REVERSAL',
  ADMIN_CREDIT = 'ADMIN_CREDIT',
  ADMIN_DEBIT = 'ADMIN_DEBIT',
  REFUND = 'REFUND',
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'wallet_id', type: 'int' })
  walletId: number;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  /** CREDIT or DEBIT */
  @Column({ type: 'varchar', length: 10 })
  type: TransactionType;

  /** Categorization of the transaction (e.g. COMMISSION_DIRECT, WITHDRAWAL) */
  @Column({ type: 'varchar', length: 40 })
  category: TransactionCategory;

  /** Amount in paise (always positive) */
  @Column({ type: 'bigint' })
  amount: number;

  /** Snapshot of wallet's available_balance AFTER this transaction */
  @Column({ name: 'balance_after', type: 'bigint' })
  balanceAfter: number;

  /** Type of related entity (e.g. ORDER, WITHDRAWAL, ADMIN) */
  @Column({ name: 'reference_type', type: 'varchar', length: 30, nullable: true })
  referenceType: string | null;

  /** ID of the related entity */
  @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
  referenceId: string | null;

  /** Human-readable description */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;
}
