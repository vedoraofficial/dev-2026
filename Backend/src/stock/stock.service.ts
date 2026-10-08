import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Product } from '../product/entity/product.entity';
import { StockMovement, StockMovementType } from './entity/stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { getStockLevels } from './stock-levels';

@Injectable()
export class StockService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
  ) {}

  /** Every (not deleted) product with received / sold / available. */
  async summary() {
    const products = await this.productRepo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    const levels = await getStockLevels(this.dataSource.manager);
    const last: { product_id: string; at: Date }[] = await this.dataSource.query(
      `SELECT product_id, MAX(created_at) AS at FROM stock_movements GROUP BY product_id`,
    );
    const lastAt = new Map(last.map((r) => [Number(r.product_id), r.at]));

    return products.map((p) => {
      const level = levels.get(Number(p.id));
      return {
        productId: Number(p.id),
        name: p.name,
        status: p.status,
        tracked: !!level,
        received: level?.received ?? 0,
        sold: level?.sold ?? 0,
        available: level?.available ?? 0,
        lastMovementAt: lastAt.get(Number(p.id)) ?? null,
      };
    });
  }

  /** Stock history, newest first (optionally for one product). */
  async movements(productId?: number, limit = 100) {
    const rows = await this.movementRepo.find({
      where: productId ? { productId } : {},
      relations: { product: true, creator: true },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return rows.map((m) => ({
      id: m.id,
      productId: Number(m.productId),
      productName: m.product?.name ?? null,
      type: m.type,
      quantity: m.quantity,
      note: m.note,
      createdBy: m.creator ? { vedId: m.creator.vedId, name: m.creator.name } : null,
      createdAt: m.createdAt,
    }));
  }

  /** Add received stock (IN) or record sold stock (OUT). OUT can't go below zero. */
  async addMovement(adminUserId: number, dto: CreateStockMovementDto) {
    return this.dataSource.transaction(async (manager) => {
      // Lock the product row so two entries at once can't oversell.
      const product = await manager
        .getRepository(Product)
        .createQueryBuilder('product')
        .setLock('pessimistic_write')
        .where('product.id = :id', { id: dto.productId })
        .andWhere('product.deleted_at IS NULL')
        .getOne();
      if (!product) throw new NotFoundException('Product not found');

      if (dto.type === StockMovementType.OUT) {
        const available = (await getStockLevels(manager, [Number(product.id)])).get(Number(product.id))?.available ?? 0;
        if (dto.quantity > available) {
          throw new BadRequestException(
            available > 0
              ? `Only ${available} in stock for ${product.name}.`
              : `${product.name} has no stock to sell — add stock first.`,
          );
        }
      }

      const movement = await manager.getRepository(StockMovement).save(
        manager.getRepository(StockMovement).create({
          productId: Number(product.id),
          type: dto.type,
          quantity: dto.quantity,
          note: dto.note?.trim() || null,
          createdBy: adminUserId,
        }),
      );
      const level = (await getStockLevels(manager, [Number(product.id)])).get(Number(product.id));
      return {
        message: dto.type === StockMovementType.IN ? 'Stock added' : 'Sale recorded',
        movementId: movement.id,
        productId: Number(product.id),
        received: level?.received ?? 0,
        sold: level?.sold ?? 0,
        available: level?.available ?? 0,
      };
    });
  }
}
