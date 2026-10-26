import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entity/product.entity';
import { ProductImage } from './entity/product-image.entity';

/** What multer hands over for an uploaded file (memory storage). */
export type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

export const PRODUCT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

/** Checks the file really is that image type (not just its name / header). */
function looksLikeImage(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

/**
 * Product photos: Admin uploads / removes one per product; the website and the portal load it
 * from GET /api/public/products/:id/image?v=<imageUpdatedAt> (a new photo gets a new link).
 */
@Injectable()
export class ProductImageService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async upload(productId: number, file: UploadedImage | undefined): Promise<Product> {
    if (!file?.buffer?.length) throw new BadRequestException('Choose a photo to upload.');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('The photo must be a JPG, PNG or WebP image.');
    }
    if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
      throw new BadRequestException('The photo must be smaller than 3 MB.');
    }
    if (!looksLikeImage(file.buffer, file.mimetype)) {
      throw new BadRequestException("This file isn't a valid image.");
    }

    await this.findProduct(productId);
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ProductImage).save({ productId, mime: file.mimetype, data: file.buffer });
      await manager.getRepository(Product).update(productId, { imageUpdatedAt: new Date() });
    });
    return this.findProduct(productId);
  }

  async remove(productId: number): Promise<Product> {
    await this.findProduct(productId);
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ProductImage).delete({ productId });
      await manager.getRepository(Product).update(productId, { imageUpdatedAt: null });
    });
    return this.findProduct(productId);
  }

  /** The photo itself — public, so the website can show it. */
  async get(productId: number): Promise<ProductImage> {
    const image = await this.imageRepo.findOne({ where: { productId } });
    if (!image) throw new NotFoundException('This product has no photo.');
    return image;
  }

  private async findProduct(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found.`);
    return product;
  }
}
