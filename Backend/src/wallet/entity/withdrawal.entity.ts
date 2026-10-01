import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { UserBank } from '../../user/entity/user-bank.entity';

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'bank_id', type: 'int' })
  bankId: number;

  @ManyToOne(() => UserBank, { nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank: UserBank;

  /** Withdrawal amount in paise */
  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  /** Admin user who approved/rejected */
  @Column({ name: 'admin_user_id', type: 'int', nullable: true })
  adminUserId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: User | null;

  @Column({ name: 'admin_remarks', type: 'text', nullable: true })
  adminRemarks: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
