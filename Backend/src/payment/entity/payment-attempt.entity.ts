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
import { Order } from '../../order/entity/order.entity';

export enum PaymentAttemptStatus {
  INITIATED = 'INITIATED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('payment_attempts')
export class PaymentAttempt {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'order_id', type: 'bigint' })
  @Index('IDX_payment_attempts_order_id')
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'merchant_order_id', type: 'varchar', length: 100, unique: true })
  merchantOrderId: string;

  /** Payment amount in paise */
  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: PaymentAttemptStatus.INITIATED })
  status: PaymentAttemptStatus;

  @Column({ name: 'provider_reference_id', type: 'varchar', length: 100, nullable: true })
  providerReferenceId: string | null;

  @Column({ name: 'redirect_url', type: 'text', nullable: true })
  redirectUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
