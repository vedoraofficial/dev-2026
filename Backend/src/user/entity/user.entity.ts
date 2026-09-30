import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

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

  @Column({ name: 'reset_token', type: 'varchar', nullable: true })
  resetToken: string | null;

  @Column({ name: 'reset_token_expires', type: 'timestamptz', nullable: true })
  resetTokenExpires: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
