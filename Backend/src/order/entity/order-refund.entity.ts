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
import { Order } from './order.entity';
import { User } from '../../user/entity/user.entity';
import { WalletTransaction } from '../../wallet/entity/wallet-transaction.entity';

export enum OrderRefundStatus {
  INITIATED = 'INITIATED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('order_refunds')
export class OrderRefund {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'order_id', type: 'bigint' })
  @Index('IDX_order_refunds_order_id')
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  /** Refund amount in paise */
  @Column({ name: 'refund_amount', type: 'bigint' })
  refundAmount: number;

  @Column({ type: 'varchar', length: 20, default: OrderRefundStatus.INITIATED })
  status: OrderRefundStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'phonepe_refund_id', type: 'varchar', length: 100, nullable: true })
  phonepeRefundId: string | null;

  @Column({ name: 'wallet_transaction_id', type: 'bigint', nullable: true })
  walletTransactionId: number | null;

  @ManyToOne(() => WalletTransaction, { nullable: true })
  @JoinColumn({ name: 'wallet_transaction_id' })
  walletTransaction: WalletTransaction | null;

  @Column({ name: 'created_by_admin_id', type: 'int', nullable: true })
  adminUserId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_admin_id' })
  adminUser: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
