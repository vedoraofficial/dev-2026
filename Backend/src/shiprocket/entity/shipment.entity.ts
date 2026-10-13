import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Order } from '../../order/entity/order.entity';

export enum ShipmentStatus {
  NEW = 'NEW',
  AWB_ASSIGNED = 'AWB_ASSIGNED',
  LABEL_GENERATED = 'LABEL_GENERATED',
  PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  RTO_INITIATED = 'RTO_INITIATED',
  RTO_DELIVERED = 'RTO_DELIVERED',
  CANCELLED = 'CANCELLED',
  LOST = 'LOST',
}

export interface TrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  srStatus?: string;
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'order_id', type: 'bigint', unique: true })
  orderId: number;

  @OneToOne(() => Order, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'shiprocket_order_id', type: 'varchar', length: 50, nullable: true })
  shiprocketOrderId: string | null;

  @Column({ name: 'shiprocket_shipment_id', type: 'varchar', length: 50, nullable: true })
  shiprocketShipmentId: string | null;

  @Index()
  @Column({ name: 'awb_code', type: 'varchar', length: 50, nullable: true, unique: true })
  awbCode: string | null;

  @Column({ name: 'courier_name', type: 'varchar', length: 100, nullable: true })
  courierName: string | null;

  @Column({ name: 'courier_company_id', type: 'int', nullable: true })
  courierCompanyId: number | null;

  @Column({
    name: 'current_status',
    type: 'varchar',
    length: 50,
    default: ShipmentStatus.NEW,
  })
  currentStatus: string;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ name: 'etd', type: 'timestamptz', nullable: true })
  etd: Date | null;

  @Column({ name: 'current_location', type: 'varchar', length: 150, nullable: true })
  currentLocation: string | null;

  @Column({ name: 'tracking_url', type: 'text', nullable: true })
  trackingUrl: string | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  activities: TrackingActivity[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
