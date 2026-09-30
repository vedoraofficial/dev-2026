import { Entity, PrimaryColumn, Column, UpdateDateColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity('genealogy_commission_uplines')
export class CommissionUpline {
  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'level_1_user_id', type: 'int', nullable: true })
  level1UserId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'level_1_user_id' })
  level1User: User | null;

  @Column({ name: 'level_2_user_id', type: 'int', nullable: true })
  level2UserId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'level_2_user_id' })
  level2User: User | null;

  @Column({ name: 'level_3_user_id', type: 'int', nullable: true })
  level3UserId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'level_3_user_id' })
  level3User: User | null;

  @Column({ name: 'level_4_user_id', type: 'int', nullable: true })
  level4UserId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'level_4_user_id' })
  level4User: User | null;

  @Column({ name: 'level_5_user_id', type: 'int', nullable: true })
  level5UserId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'level_5_user_id' })
  level5User: User | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
