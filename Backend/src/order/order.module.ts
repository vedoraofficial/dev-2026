import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { CommissionDistribution } from './entity/commission-distribution.entity';
import { OrderRefund } from './entity/order-refund.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { CommissionUpline } from '../genealogy/entity/commission-upline.entity';
import { StockMovement } from '../stock/entity/stock-movement.entity';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      CommissionDistribution,
      OrderRefund,
      Product,
      User,
      CommissionUpline,
      StockMovement,
    ]),
    forwardRef(() => WalletModule),
    NotificationModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
