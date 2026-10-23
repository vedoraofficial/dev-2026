import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RegisterWithOrderDto } from './dto/register-with-order.dto';
import { SendMobileOtpDto, VerifyMobileOtpDto } from './dto/mobile-otp.dto';
import { OnboardingService } from './onboarding.service';
import { MobileOtpService } from './mobile-otp.service';

@ApiTags('Partner / Genealogy')
@Controller('partner')
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly mobileOtpService: MobileOtpService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 5, message: 'Too many OTP requests. Please wait 1 minute.' })
  @Post('mobile-otp/send')
  @ApiOperation({ summary: "Send an OTP to the new partner's mobile number (Add Partner)" })
  @ApiResponse({ status: 409, description: 'Mobile number already registered.' })
  async sendMobileOtp(@Request() req: any, @Body() dto: SendMobileOtpDto) {
    return this.mobileOtpService.send(req.user.sub, dto.mobile);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many OTP attempts. Please wait 1 minute.' })
  @Post('mobile-otp/verify')
  @ApiOperation({
    summary: "Verify the OTP sent to the new partner's mobile number",
    description: 'A verified number can be registered with register-with-order for 30 minutes.',
  })
  async verifyMobileOtp(@Request() req: any, @Body() dto: VerifyMobileOtpDto) {
    return this.mobileOtpService.verify(req.user.sub, dto.mobile, dto.otp);
  }

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
  @ApiResponse({ status: 400, description: 'Mobile not verified with OTP, insufficient balance, out of stock, slot taken or 20-partner limit.' })
  @ApiResponse({ status: 409, description: 'Email or mobile already in use.' })
  async registerWithOrder(@Request() req: any, @Body() dto: RegisterWithOrderDto) {
    return this.onboardingService.registerWithOrder(req.user.sub, dto);
  }
}
