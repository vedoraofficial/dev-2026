import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { WalletTransaction } from './wallet-transaction.entity';

export enum WalletTopupStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('wallet_topups')
export class WalletTopup {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  @Index('IDX_wallet_topups_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Topup amount in paise */
  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: WalletTopupStatus.PENDING })
  status: WalletTopupStatus;

  @Column({ name: 'phonepe_merchant_order_id', type: 'varchar', length: 100, unique: true })
  phonepeMerchantOrderId: string;

  @Column({ name: 'phonepe_transaction_id', type: 'varchar', length: 100, nullable: true })
  phonepeTransactionId: string | null;

  @Column({ name: 'phonepe_redirect_url', type: 'text', nullable: true })
  phonepeRedirectUrl: string | null;

  @Column({ name: 'wallet_transaction_id', type: 'bigint', nullable: true })
  walletTransactionId: number | null;

  @ManyToOne(() => WalletTransaction, { nullable: true })
  @JoinColumn({ name: 'wallet_transaction_id' })
  walletTransaction: WalletTransaction | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
