import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entity/user.entity';

export enum OrderCheckoutStatus {
  /** Waiting for the Razorpay payment */
  PENDING = 'PENDING',
  /** Paid — its orders are confirmed */
  PAID = 'PAID',
}

/**
 * A cart paid online with one Razorpay payment. Each product is still its own order (shipping,
 * cancel and commissions work per order); this row ties them to the one payment.
 */
@Entity('order_checkouts')
export class OrderCheckout {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  @Index('IDX_order_checkouts_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** The orders paid by this checkout */
  @Column({ name: 'order_ids', type: 'jsonb' })
  orderIds: number[];

  /** Total in paise */
  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: OrderCheckoutStatus.PENDING })
  status: OrderCheckoutStatus;

  @Column({ name: 'razorpay_order_id', type: 'varchar', length: 100, unique: true })
  razorpayOrderId: string;

  @Column({ name: 'razorpay_payment_id', type: 'varchar', length: 100, nullable: true })
  razorpayPaymentId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
