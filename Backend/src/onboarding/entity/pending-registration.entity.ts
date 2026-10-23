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
import { Order } from '../../order/entity/order.entity';
import type { RegistrationDetails } from '../../genealogy/genealogy.service';

export enum PendingRegistrationStatus {
  /** Waiting for the Razorpay payment */
  PENDING = 'PENDING',
  /** Paid — the partner and their joining order were created */
  COMPLETED = 'COMPLETED',
  /** Payment failed or was cancelled — nobody was created */
  FAILED = 'FAILED',
  /** Paid, but the partner could not be created — the amount went back to the sponsor's wallet */
  REFUNDED = 'REFUNDED',
}

/**
 * A partner registration (with its joining order) held until the sponsor's Razorpay payment is
 * confirmed. The partner account is only created once the payment succeeds.
 */
@Entity('pending_registrations')
export class PendingRegistration {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'sponsor_user_id', type: 'int' })
  @Index('IDX_pending_registrations_sponsor_user_id')
  sponsorUserId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sponsor_user_id' })
  sponsor: User;

  /** Everything the registration needs except the password */
  @Column({ type: 'jsonb' })
  details: Omit<RegistrationDetails, 'password'>;

  /** bcrypt hash of the new partner's password; cleared once the registration is settled */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ name: 'product_id', type: 'bigint' })
  productId: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  /** Joining order total in paise */
  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: PendingRegistrationStatus.PENDING })
  status: PendingRegistrationStatus;

  /** Razorpay order id the sponsor pays against */
  @Column({ name: 'razorpay_order_id', type: 'varchar', length: 100, unique: true })
  razorpayOrderId: string;

  /** Razorpay payment id, once paid */
  @Column({ name: 'razorpay_payment_id', type: 'varchar', length: 100, nullable: true })
  razorpayPaymentId: string | null;

  @Column({ name: 'created_user_id', type: 'int', nullable: true })
  createdUserId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_user_id' })
  createdUser: User | null;

  @Column({ name: 'order_id', type: 'bigint', nullable: true })
  orderId: number | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
