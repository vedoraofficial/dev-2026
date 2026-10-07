import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../user/entity/user.entity';

export enum PlacementStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

@Entity('genealogy_nodes')
@Unique(['parentUserId', 'slotNumber'])
export class GenealogyNode {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'int', unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'parent_user_id', type: 'int', nullable: true })
  parentUserId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_user_id' })
  parentUser: User | null;

  /** Who enrolled this partner (earns the direct commission). Can differ from the tree parent. */
  @Column({ name: 'sponsor_user_id', type: 'int', nullable: true })
  sponsorUserId: number | null;

  @Column({ name: 'slot_number', type: 'smallint', nullable: true })
  slotNumber: number | null;

  @Column({ type: 'int', default: 0 })
  depth: number;

  @Column({ name: 'placement_status', type: 'varchar', length: 20, default: PlacementStatus.ACTIVE })
  placementStatus: PlacementStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
