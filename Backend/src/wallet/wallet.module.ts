import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entity/wallet.entity';
import { WalletTransaction } from './entity/wallet-transaction.entity';
import { Withdrawal } from './entity/withdrawal.entity';
import { WalletTopup } from './entity/wallet-topup.entity';
import { UserBank } from '../user/entity/user-bank.entity';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction, Withdrawal, UserBank, WalletTopup]),
    NotificationModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
