import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entity/product.entity';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { OrderModule } from '../order/order.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from '../payment/payment.module';
import { NotificationModule } from '../notification/notification.module';
import { PendingRegistration } from './entity/pending-registration.entity';
import { MobileOtp } from './entity/mobile-otp.entity';
import { User } from '../user/entity/user.entity';
import { OnboardingService } from './onboarding.service';
import { MobileOtpService } from './mobile-otp.service';
import { OnboardingController } from './onboarding.controller';
import { JoinController } from './join.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PendingRegistration, Product, MobileOtp, User]),
    GenealogyModule,
    forwardRef(() => OrderModule),
    forwardRef(() => WalletModule),
    forwardRef(() => PaymentModule),
    NotificationModule,
  ],
  controllers: [OnboardingController, JoinController],
  providers: [OnboardingService, MobileOtpService],
})
export class OnboardingModule {}
