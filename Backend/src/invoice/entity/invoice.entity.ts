import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Order } from '../../order/entity/order.entity';
import { User } from '../../user/entity/user.entity';

/**
 * The invoice of one payment — a single order, or every order of a cart paid together. Numbered
 * once, sequential within an Indian financial year (VED/2026-27/000001). The PDF itself is built on
 * demand from the orders, so nothing else is stored.
 */
@Entity('invoices')
@Unique('UQ_invoices_financial_year_seq', ['financialYear', 'seq'])
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  /** The buyer */
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'invoice_number', type: 'varchar', length: 30, unique: true })
  invoiceNumber: string;

  /** e.g. 2026-27 (April to March) */
  @Column({ name: 'financial_year', type: 'varchar', length: 7 })
  financialYear: string;

  /** Running number within the financial year */
  @Column({ type: 'int' })
  seq: number;

  /** When the PDF was emailed to the buyer; null = not sent (no email, or mail not configured) */
  @Column({ name: 'emailed_at', type: 'timestamptz', nullable: true })
  emailedAt: Date | null;

  @CreateDateColumn({ name: 'issued_at', type: 'timestamptz', precision: 3 })
  issuedAt: Date;

  @OneToMany(() => InvoiceOrder, (item) => item.invoice)
  items: InvoiceOrder[];
}

/** An order on an invoice — each order is on exactly one invoice. */
@Entity('invoice_orders')
export class InvoiceOrder {
  @PrimaryColumn({ name: 'invoice_id', type: 'int' })
  invoiceId: number;

  @PrimaryColumn({ name: 'order_id', type: 'bigint', unique: true })
  orderId: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
