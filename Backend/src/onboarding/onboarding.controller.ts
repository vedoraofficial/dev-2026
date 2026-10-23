import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RegisterWithOrderDto } from './dto/register-with-order.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Partner / Genealogy')
@Controller('partner')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many registration requests. Please wait a moment.' })
  @Post('register-with-order')
  @ApiOperation({
    summary: 'Add a downline partner with a paid joining order (sponsor pays by wallet or Razorpay)',
    description:
      'WALLET: debits your wallet and creates the partner plus a PAID order in one go. ' +
      'RAZORPAY: returns Razorpay checkout details — the partner is created only once the payment ' +
      'is verified (POST /api/payment/verify, or GET /api/payment/status/:razorpayOrderId).',
  })
  @ApiResponse({ status: 201, description: 'COMPLETED (wallet) or PAYMENT_REQUIRED (Razorpay).' })
  @ApiResponse({ status: 400, description: 'Insufficient balance, out of stock, slot taken or 20-partner limit.' })
  @ApiResponse({ status: 409, description: 'Email or mobile already in use.' })
  async registerWithOrder(@Request() req: any, @Body() dto: RegisterWithOrderDto) {
    return this.onboardingService.registerWithOrder(req.user.sub, dto);
  }
}
