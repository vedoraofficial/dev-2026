import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BvWallet } from './entity/bv-wallet.entity';
import { BvLedger } from './entity/bv-ledger.entity';
import { BvService } from './bv.service';
import { BvController } from './bv.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BvWallet, BvLedger])],
  controllers: [BvController],
  providers: [BvService],
  exports: [BvService],
})
export class BvModule {}
