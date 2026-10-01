import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Withdrawable balance in paise (₹1 = 100 paise) */
  @Column({ name: 'available_balance', type: 'bigint', default: 0 })
  availableBalance: number;

  /** Balance held for pending withdrawal requests (in paise) */
  @Column({ name: 'locked_balance', type: 'bigint', default: 0 })
  lockedBalance: number;

  /** Lifetime total credits received (in paise) */
  @Column({ name: 'total_earned', type: 'bigint', default: 0 })
  totalEarned: number;

  /** Lifetime total amount withdrawn (in paise) */
  @Column({ name: 'total_withdrawn', type: 'bigint', default: 0 })
  totalWithdrawn: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
