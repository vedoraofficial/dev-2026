import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from '../../user/entity/user.entity';
import { WalletTransaction } from '../../wallet/entity/wallet-transaction.entity';

@Entity('commission_distributions')
export class CommissionDistribution {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  /** The user who receives this commission */
  @Column({ name: 'beneficiary_user_id', type: 'int' })
  beneficiaryUserId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'beneficiary_user_id' })
  beneficiaryUser: User;

  /** 0 = direct referral bonus, 1-5 = level income */
  @Column({ type: 'smallint' })
  level: number;

  /** Commission rate × 100 (e.g. 1000 = 10%) */
  @Column({ name: 'commission_rate', type: 'int' })
  commissionRate: number;

  /** Actual commission amount in paise */
  @Column({ type: 'bigint' })
  amount: number;

  /** Link to the wallet transaction that credited this commission */
  @Column({ name: 'wallet_transaction_id', type: 'bigint', nullable: true })
  walletTransactionId: number | null;

  @ManyToOne(() => WalletTransaction, { nullable: true })
  @JoinColumn({ name: 'wallet_transaction_id' })
  walletTransaction: WalletTransaction | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;
}
