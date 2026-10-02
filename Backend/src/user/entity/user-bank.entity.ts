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

  /** Name returned from the bank during penny drop */
  @Column({ name: 'verified_name', type: 'varchar', length: 150, nullable: true })
  verifiedName?: string | null;

  /** Match score between accountHolderName/userName and bank registered name (0 to 100) */
  @Column({ name: 'name_match_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  nameMatchScore?: number | null;

  /** Cashfree match categorization (e.g. DIRECT, GOOD, MODERATE, POOR, NO_MATCH) */
  @Column({ name: 'name_match_result', type: 'varchar', length: 30, nullable: true })
  nameMatchResult?: string | null;

  /** Bank UTR / Reference number for the ₹1 penny transfer */
  @Column({ name: 'utr', type: 'varchar', length: 100, nullable: true })
  utr?: string | null;

  /** Cashfree verification transaction reference ID */
  @Column({ name: 'verification_reference_id', type: 'varchar', length: 100, nullable: true })
  verificationReferenceId?: string | null;

  /** Failure reason if verification was rejected or failed */
  @Column({ name: 'verification_failed_reason', type: 'text', nullable: true })
  verificationFailedReason?: string | null;

  /** Timestamp when verification succeeded */
  @Column({ name: 'verified_at', type: 'timestamptz', precision: 3, nullable: true })
  verifiedAt?: Date | null;

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
