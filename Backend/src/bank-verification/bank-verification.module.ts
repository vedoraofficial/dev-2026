import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RazorpayBankVerificationService } from './razorpay-bank-verification.service';
import { CashfreeVerificationService } from './cashfree-verification.service';

@Module({
  imports: [ConfigModule],
  providers: [RazorpayBankVerificationService, CashfreeVerificationService],
  exports: [RazorpayBankVerificationService, CashfreeVerificationService],
})
export class BankVerificationModule {}
