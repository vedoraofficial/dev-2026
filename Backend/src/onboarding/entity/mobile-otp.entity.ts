import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../user/entity/user.entity';

/** ADD_PARTNER: a sponsor adding a partner · JOIN: someone joining from a referral link */
export type MobileOtpPurpose = 'ADD_PARTNER' | 'JOIN';

/**
 * OTP sent to a new partner's mobile number during Add Partner. The partner doesn't exist yet,
 * so (unlike `otps`) it is keyed by the mobile number and the sponsor who asked for it — on the
 * referral join page, the sponsor whose link it is.
 */
@Entity('mobile_otps')
@Index('IDX_mobile_otps_mobile_requested_by', ['mobile', 'requestedBy'])
export class MobileOtp {
  @PrimaryGeneratedColumn()
  id: number;

  /** 10-digit mobile number the OTP was sent to */
  @Column({ type: 'varchar', length: 15 })
  mobile: string;

  /** sha256 of the 6-digit code */
  @Column({ name: 'otp_code', type: 'varchar', length: 255 })
  otpCode: string;

  @Column({ type: 'varchar', length: 20, default: 'ADD_PARTNER' })
  purpose: MobileOtpPurpose;

  @Column({ name: 'requested_by', type: 'int' })
  requestedBy: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'requested_by' })
  requester: User;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'attempts_count', type: 'int', default: 0 })
  attemptsCount: number;

  /** Set once the right code is entered */
  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  /** Replaced by a newer OTP, or locked after too many wrong attempts */
  @Column({ name: 'is_used', default: false })
  isUsed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;
}
