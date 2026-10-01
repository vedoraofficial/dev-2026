import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Product } from '../../product/entity/product.entity';

export enum PaymentMethod {
  PHONEPE = 'PHONEPE',
  WALLET = 'WALLET',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  DELIVERED = 'DELIVERED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'product_id', type: 'bigint' })
  productId: number;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  /** sale_price snapshot at time of purchase (paise) */
  @Column({ name: 'unit_price', type: 'bigint' })
  unitPrice: number;

  /** unit_price × quantity (paise) */
  @Column({ name: 'total_amount', type: 'bigint' })
  totalAmount: number;

  /** bv_amount × quantity */
  @Column({ name: 'bv_total', type: 'bigint' })
  bvTotal: number;

  @Column({ name: 'payment_method', type: 'varchar', length: 20 })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_status', type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  /** Unique merchant order ID sent to PhonePe */
  @Column({ name: 'phonepe_merchant_order_id', type: 'varchar', length: 100, nullable: true, unique: true })
  phonepeMerchantOrderId: string | null;

  /** PhonePe's transaction ID returned after payment */
  @Column({ name: 'phonepe_transaction_id', type: 'varchar', length: 100, nullable: true })
  phonepeTransactionId: string | null;

  /** PhonePe checkout redirect URL (for client redirect) */
  @Column({ name: 'phonepe_redirect_url', type: 'text', nullable: true })
  phonepeRedirectUrl: string | null;

  @Column({ name: 'order_status', type: 'varchar', length: 20, default: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  /** Whether commissions have been distributed for this order */
  @Column({ name: 'commissions_distributed', type: 'boolean', default: false })
  commissionsDistributed: boolean;

  /** Admin user ID if this was a cash/admin order */
  @Column({ name: 'created_by_admin_id', type: 'int', nullable: true })
  createdByAdminId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
