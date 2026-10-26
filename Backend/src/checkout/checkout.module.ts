import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entity/product.entity';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { NotificationModule } from '../notification/notification.module';
import { OrderCheckout } from './entity/order-checkout.entity';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderCheckout, Product]),
    forwardRef(() => OrderModule),
    forwardRef(() => PaymentModule),
    NotificationModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
