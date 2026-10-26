import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductImageService } from './product-image.service';
import { ProductController } from './product.controller';
import { ProductPublicController } from './product-public.controller';
import { Product } from './entity/product.entity';
import { ProductImage } from './entity/product-image.entity';

import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage]), NotificationModule],
  controllers: [ProductController, ProductPublicController],
  providers: [ProductService, ProductImageService],
  exports: [ProductService],
})
export class ProductModule {}
