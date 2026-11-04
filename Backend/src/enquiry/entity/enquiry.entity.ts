import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const ENQUIRY_TOPICS = ['Order', 'Product', 'Payment', 'Partner account', 'Other'] as const;
export type EnquiryTopic = (typeof ENQUIRY_TOPICS)[number];

export enum EnquiryStatus {
  /** Just sent from the website — nobody has called back yet */
  NEW = 'NEW',
  /** The team has contacted the person */
  CONTACTED = 'CONTACTED',
}

/** A "Send us a message" form sent from the website's contact page. */
@Entity('enquiries')
@Index('IDX_enquiries_created_at', ['createdAt'])
export class Enquiry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 15 })
  mobile: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  /** Order or Partner ID the person typed, if any */
  @Column({ type: 'varchar', length: 60, nullable: true })
  reference: string | null;

  @Column({ type: 'varchar', length: 30 })
  topic: EnquiryTopic;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: EnquiryStatus.NEW })
  status: EnquiryStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
