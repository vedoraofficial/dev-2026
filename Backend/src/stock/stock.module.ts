import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entity/product.entity';
import { StockMovement } from './entity/stock-movement.entity';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Product])],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
