import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entity/notification.entity';
import { User } from '../user/entity/user.entity';
import { GenealogyNode } from '../genealogy/entity/genealogy-node.entity';
import { CommissionUpline } from '../genealogy/entity/commission-upline.entity';
import { NotificationService } from './notification.service';
import { OtpSenderService } from './otp-sender.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, GenealogyNode, CommissionUpline])],
  controllers: [NotificationController],
  providers: [NotificationService, OtpSenderService],
  exports: [NotificationService, OtpSenderService],
})
export class NotificationModule {}
