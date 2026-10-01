import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenealogyNode } from './entity/genealogy-node.entity';
import { CommissionUpline } from './entity/commission-upline.entity';
import { User } from '../user/entity/user.entity';
import { UserProfile } from '../user/entity/user-profile.entity';
import { GenealogyService } from './genealogy.service';
import { GenealogyController } from './genealogy.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GenealogyNode, CommissionUpline, User, UserProfile]),
    WalletModule,
  ],
  controllers: [GenealogyController],
  providers: [GenealogyService],
  exports: [GenealogyService],
})
export class GenealogyModule {}
