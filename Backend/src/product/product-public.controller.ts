import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';

/** No sign-in needed — used by the public referral join page. */
@ApiTags('Product')
@Controller('public/products')
export class ProductPublicController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Public: products on sale (ACTIVE), with available stock' })
  findOnSale() {
    return this.productService.findOnSale();
  }
}
