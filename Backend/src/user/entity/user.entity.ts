import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, Unique } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserBank } from './user-bank.entity';
import { UserProfile } from './user-profile.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  FOUNDER = 'FOUNDER',
  PARTNER = 'PARTNER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

@Entity('users')
// One PAN card per VEDORA ID (NULL — partners registered before PAN was collected — is allowed many times)
@Unique('UQ_users_pan_number', ['panNumber'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ved_id', type: 'varchar', length: 20, unique: true })
  vedId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  mobile: string;

  /** PAN card (e.g. ABCDE1234F), given at registration */
  @Column({ name: 'pan_number', type: 'varchar', length: 10, nullable: true })
  panNumber: string | null;

  /** Aadhaar card (12 digits), given at registration — not unique, shared across family IDs */
  @Column({ type: 'varchar', length: 12, nullable: true })
  aadhaar: string | null;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.PARTNER })
  role: UserRole;

  @Column({ type: 'varchar', length: 20, default: UserStatus.PENDING })
  status: UserStatus;

  @OneToMany(() => UserBank, bank => bank.user, { cascade: true })
  banks: UserBank[];

  @OneToOne(() => UserProfile, profile => profile.user, { cascade: true })
  profile: UserProfile;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
