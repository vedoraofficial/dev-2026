import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { GenealogyModule } from './genealogy/genealogy.module';
import { WalletModule } from './wallet/wallet.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { StockModule } from './stock/stock.module';
import { ShiprocketModule } from './shiprocket/shiprocket.module';
import { PayoutModule } from './payout/payout.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { InvoiceModule } from './invoice/invoice.module';
import { CheckoutModule } from './checkout/checkout.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Since we use migrations, synchronize MUST be false in production
        synchronize: false, 
      }),
    }),
    UserModule,
    AuthModule,
    ProductModule,
    GenealogyModule,
    WalletModule,
    OrderModule,
    PaymentModule,
    PayoutModule,
    NotificationModule,
    StockModule,
    ShiprocketModule,
    OnboardingModule,
    InvoiceModule,
    CheckoutModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
