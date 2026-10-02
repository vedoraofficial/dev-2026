import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entity/wallet.entity';
import { WalletTransaction } from './entity/wallet-transaction.entity';
import { Withdrawal } from './entity/withdrawal.entity';
import { UserBank } from '../user/entity/user-bank.entity';
import { NotificationModule } from '../notification/notification.module';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction, Withdrawal, UserBank]),
    NotificationModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
