import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum BankVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('user_banks')
export class UserBank {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'account_holder_name', type: 'varchar', length: 150 })
  accountHolderName: string;

  @Column({ name: 'account_number', type: 'varchar', length: 50 })
  accountNumber: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 150 })
  bankName: string;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 20 })
  ifscCode: string;

  @Column({ name: 'verification_status', type: 'varchar', length: 20, default: BankVerificationStatus.PENDING })
  verificationStatus: BankVerificationStatus;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @ManyToOne(() => User, user => user.banks, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
