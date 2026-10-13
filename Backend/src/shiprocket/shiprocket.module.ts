import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entity/shipment.entity';
import { Order } from '../order/entity/order.entity';
import { ShiprocketService } from './shiprocket.service';
import { ShiprocketController } from './shiprocket.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, Order])],
  controllers: [ShiprocketController],
  providers: [ShiprocketService],
  exports: [ShiprocketService],
})
export class ShiprocketModule {}
