import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity('bv_ledger')
export class BvLedger {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  /** The sponsor who earned this BV */
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** The partner whose order generated this BV */
  @Column({ name: 'from_user_id', type: 'int' })
  fromUserId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @Column({ type: 'int' })
  amount: number;

  /** Snapshot of the BV wallet's balance AFTER this entry */
  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;

  @Column({ name: 'reference_type', type: 'varchar', length: 30, nullable: true })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
  referenceId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;
}
