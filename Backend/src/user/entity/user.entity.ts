import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
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
