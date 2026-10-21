import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenealogyNode } from './entity/genealogy-node.entity';
import { CommissionUpline } from './entity/commission-upline.entity';
import { User } from '../user/entity/user.entity';
import { UserProfile } from '../user/entity/user-profile.entity';
import { Product } from '../product/entity/product.entity';
import { Order } from '../order/entity/order.entity';
import { StockMovement } from '../stock/entity/stock-movement.entity';
import { GenealogyService } from './genealogy.service';
import { GenealogyController } from './genealogy.controller';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GenealogyNode,
      CommissionUpline,
      User,
      UserProfile,
      Product,
      Order,
      StockMovement,
    ]),
    WalletModule,
    NotificationModule,
    forwardRef(() => OrderModule),
  ],
  controllers: [GenealogyController],
  providers: [GenealogyService],
  exports: [GenealogyService],
})
export class GenealogyModule {}
