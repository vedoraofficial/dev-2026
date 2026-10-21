import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RazorpayPayoutService } from './razorpay-payout.service';

@Module({
  imports: [ConfigModule],
  providers: [RazorpayPayoutService],
  exports: [RazorpayPayoutService],
})
export class PayoutModule {}
