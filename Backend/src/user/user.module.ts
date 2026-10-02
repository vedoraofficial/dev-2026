import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserBank } from './entity/user-bank.entity';
import { UserProfile } from './entity/user-profile.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { BankVerificationModule } from '../bank-verification/bank-verification.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserBank, UserProfile]),
    BankVerificationModule,
    NotificationModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

