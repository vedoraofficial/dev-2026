import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SrpWallet } from './entity/srp-wallet.entity';
import { SrpLedger } from './entity/srp-ledger.entity';
import { User } from '../user/entity/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { SrpService } from './srp.service';
import { SrpController } from './srp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SrpWallet, SrpLedger, User]), NotificationModule],
  controllers: [SrpController],
  providers: [SrpService],
  exports: [SrpService],
})
export class SrpModule {}
