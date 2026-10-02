import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CashfreeVerificationService } from './cashfree-verification.service';

@Module({
  imports: [ConfigModule],
  providers: [CashfreeVerificationService],
  exports: [CashfreeVerificationService],
})
export class BankVerificationModule {}
