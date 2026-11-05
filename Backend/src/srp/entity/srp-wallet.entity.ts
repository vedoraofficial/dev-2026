import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

/** Sales Reward Points — 2 SRP per confirmed sale, redeemable 10 SRP = 1 month of free ID activation. */
@Entity('srp_wallets')
export class SrpWallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', default: 0 })
  balance: number;

  /** Lifetime SRP earned (never decreases) */
  @Column({ name: 'total_earned', type: 'int', default: 0 })
  totalEarned: number;

  /** Lifetime SRP deducted — manual redemption or the monthly auto-deduct */
  @Column({ name: 'total_redeemed', type: 'int', default: 0 })
  totalRedeemed: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
