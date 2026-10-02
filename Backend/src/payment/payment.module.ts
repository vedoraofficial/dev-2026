import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEvent } from './entity/payment-event.entity';
import { Order } from '../order/entity/order.entity';
import { OrderModule } from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEvent, Order]),
    OrderModule,
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
