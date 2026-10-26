import { Entity, PrimaryColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

/**
 * A product's photo, uploaded by Admin. Kept in the database (not on the server's disk) so it
 * survives redeploys; served by GET /api/public/products/:id/image.
 */
@Entity('product_images')
export class ProductImage {
  @PrimaryColumn({ name: 'product_id', type: 'bigint' })
  productId: number;

  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  /** image/webp, image/jpeg or image/png */
  @Column({ type: 'varchar', length: 40 })
  mime: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;
}
