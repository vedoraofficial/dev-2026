import { Controller, Get, Header, Param, ParseIntPipe, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { ProductImageService } from './product-image.service';

/** No sign-in needed — used by the public referral join page and the website. */
@ApiTags('Product')
@Controller('public/products')
export class ProductPublicController {
  constructor(
    private readonly productService: ProductService,
    private readonly productImageService: ProductImageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Public: products on sale (ACTIVE), with available stock' })
  findOnSale() {
    return this.productService.findOnSale();
  }

  @Get(':id/image')
  // Links carry ?v=<imageUpdatedAt>, so a new photo is a new link — browsers may cache each one.
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  @ApiOperation({ summary: 'Public: the product photo uploaded by Admin' })
  async image(@Param('id', ParseIntPipe) id: number) {
    const image = await this.productImageService.get(id);
    return new StreamableFile(image.data, { type: image.mime, length: image.data.length });
  }
}
