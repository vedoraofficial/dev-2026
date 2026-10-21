import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payment_events')
export class PaymentEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'razorpay_order_id', type: 'varchar', length: 100, nullable: true })
  razorpayOrderId: string | null;

  /** CALLBACK, WEBHOOK, or STATUS_CHECK */
  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: string;

  /** Raw Razorpay response payload for debugging & dispute resolution */
  @Column({ type: 'jsonb' })
  payload: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;
}
