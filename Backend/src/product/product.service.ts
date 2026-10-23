import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product, ProductStatus } from './entity/product.entity';
import { Order } from '../order/entity/order.entity';
import { getStockLevels } from '../stock/stock-levels';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';

/**
 * Auto SKU: VED-<first word of the name, without "VEDORA">-<product number>,
 * e.g. "VEDORA PYRITE LEGACY" #3 → VED-PYRITE-003. The product number keeps it unique.
 */
export function generateSku(name: string, id: number): string {
  const word = name
    .replace(/\bvedora\b/gi, ' ')
    .replace(/[^a-z0-9 ]/gi, ' ')
    .trim()
    .split(/\s+/)[0]
    ?.toUpperCase()
    .slice(0, 20);
  return `VED-${word || 'PRD'}-${String(id).padStart(3, '0')}`;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateProductDto, userId: number): Promise<Product> {
    if (dto.salePrice > dto.mrp) {
      throw new BadRequestException('Sale price cannot exceed Maximum Retail Price (MRP).');
    }

    const sku = this.normalizeSku(dto.sku);
    if (sku) await this.assertSkuFree(sku);

    const product = this.productRepo.create({
      ...dto,
      sku,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.productRepo.save(product);
    if (!saved.sku) {
      saved.sku = generateSku(saved.name, Number(saved.id));
      await this.productRepo.save(saved);
    }

    if (saved.status === ProductStatus.ACTIVE) {
      const priceFormatted = `₹${(Number(saved.salePrice) / 100).toFixed(2)}`;
      await this.notificationService.notifyAllPartners(
        NotificationKey.PRODUCT_LAUNCHED,
        `New in the catalogue: ${saved.name}`,
        `Now available at ${priceFormatted} · ${saved.bvAmount} BV per unit.`,
        { productId: Number(saved.id), pricePaise: Number(saved.salePrice), bv: Number(saved.bvAmount) },
      );
    }

    return saved;
  }

  async findAll() {
    const products = await this.productRepo.find({ where: { deletedAt: IsNull() }, order: { createdAt: 'DESC' } });
    return this.withStock(products);
  }

  /** Products partners can buy right now (ACTIVE), with stock — also served publicly. */
  async findOnSale() {
    const products = await this.productRepo.find({
      where: { deletedAt: IsNull(), status: ProductStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    return this.withStock(products);
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /** Adds `stockAvailable`: units left (0 when no stock was ever added). */
  private async withStock(products: Product[]) {
    const levels = await getStockLevels(this.productRepo.manager, products.map((p) => Number(p.id)));
    return products.map((p) => ({ ...p, stockAvailable: levels.get(Number(p.id))?.available ?? 0 }));
  }

  async update(id: number, dto: UpdateProductDto, userId: number): Promise<Product> {
    const product = await this.findById(id);
    const wasActive = product.status === ProductStatus.ACTIVE;

    const effectiveMrp = dto.mrp !== undefined ? dto.mrp : product.mrp;
    const effectiveSalePrice = dto.salePrice !== undefined ? dto.salePrice : product.salePrice;
    if (effectiveSalePrice > effectiveMrp) {
      throw new BadRequestException('Sale price cannot exceed Maximum Retail Price (MRP).');
    }
    
    const { sku: skuInput, ...rest } = dto;
    Object.assign(product, rest);
    if (skuInput !== undefined) {
      const sku = this.normalizeSku(skuInput);
      if (sku) await this.assertSkuFree(sku, Number(product.id));
      product.sku = sku ?? generateSku(product.name, Number(product.id));
    }
    product.updatedBy = userId;

    const saved = await this.productRepo.save(product);

    if (!wasActive && saved.status === ProductStatus.ACTIVE) {
      const priceFormatted = `₹${(Number(saved.salePrice) / 100).toFixed(2)}`;
      await this.notificationService.notifyAllPartners(
        NotificationKey.PRODUCT_LAUNCHED,
        `New in the catalogue: ${saved.name}`,
        `Now available at ${priceFormatted} · ${saved.bvAmount} BV per unit.`,
        { productId: Number(saved.id), pricePaise: Number(saved.salePrice), bv: Number(saved.bvAmount) },
      );
    }

    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.findById(id);

    // Orders (and their payments and commissions) point at the product, so a product that was
    // ever ordered is hidden instead of removed. Marking it INACTIVE also blocks new orders.
    const orderCount = await this.productRepo.manager.count(Order, { where: { productId: product.id } });
    if (orderCount > 0) {
      product.deletedAt = new Date();
      product.status = ProductStatus.INACTIVE;
      await this.productRepo.save(product);
    } else {
      await this.productRepo.remove(product);
    }
    return { message: 'Product deleted successfully' };
  }

  /** Trimmed and upper-cased; empty means "generate one". */
  private normalizeSku(sku?: string | null): string | null {
    const value = sku?.trim().toUpperCase();
    return value ? value : null;
  }

  /** SKUs are unique — including products that were deleted but still exist for old orders. */
  private async assertSkuFree(sku: string, exceptProductId?: number) {
    const existing = await this.productRepo.findOne({ where: { sku } });
    if (existing && Number(existing.id) !== exceptProductId) {
      throw new ConflictException(`SKU ${sku} is already used by "${existing.name}". Choose another one.`);
    }
  }
}
