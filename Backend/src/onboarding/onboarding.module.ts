import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entity/product.entity';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { OrderModule } from '../order/order.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from '../payment/payment.module';
import { NotificationModule } from '../notification/notification.module';
import { PendingRegistration } from './entity/pending-registration.entity';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PendingRegistration, Product]),
    GenealogyModule,
    forwardRef(() => OrderModule),
    forwardRef(() => WalletModule),
    forwardRef(() => PaymentModule),
    NotificationModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
