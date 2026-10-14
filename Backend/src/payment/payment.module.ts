import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEvent } from './entity/payment-event.entity';
import { PaymentAttempt } from './entity/payment-attempt.entity';
import { WalletTopup } from '../wallet/entity/wallet-topup.entity';
import { Order } from '../order/entity/order.entity';
import { OrderModule } from '../order/order.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentService } from './payment.service';
import { PaymentReconciliationService } from './reconciliation.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEvent, Order, PaymentAttempt, WalletTopup]),
    forwardRef(() => OrderModule),
    forwardRef(() => WalletModule),
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentReconciliationService],
  exports: [PaymentService, PaymentReconciliationService],
})
export class PaymentModule {}
