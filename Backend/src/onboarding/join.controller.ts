import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import {
  JoinSendOtpDto,
  JoinVerifyOtpDto,
  JoinWithOrderDto,
  VerifyJoinPaymentDto,
} from './dto/join-with-order.dto';
import { MobileOtpService } from './mobile-otp.service';
import { OnboardingService } from './onboarding.service';

/**
 * Referral join page (no sign-in): verify the mobile with OTP, pay the joining order online, and
 * the VEDORA ID is created once the payment succeeds — the same flow as Add Partner.
 */
@ApiTags('Public')
@Controller('public/join')
export class JoinController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly mobileOtpService: MobileOtpService,
  ) {}

  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 5, message: 'Too many OTP requests. Please wait 1 minute.' })
  @Post('otp/send')
  @ApiOperation({ summary: 'Send an OTP to the mobile number of someone joining from a referral link' })
  @ApiResponse({ status: 409, description: 'Mobile number already registered.' })
  async sendOtp(@Body() dto: JoinSendOtpDto) {
    const sponsor = await this.onboardingService.findReferralSponsor(dto.referralId);
    return this.mobileOtpService.send(Number(sponsor.id), dto.mobile, 'JOIN');
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many OTP attempts. Please wait 1 minute.' })
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify the join OTP — a verified number can join for 30 minutes' })
  async verifyOtp(@Body() dto: JoinVerifyOtpDto) {
    const sponsor = await this.onboardingService.findReferralSponsor(dto.referralId);
    return this.mobileOtpService.verify(Number(sponsor.id), dto.mobile, dto.otp, 'JOIN');
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many join requests. Please wait a moment.' })
  @Post()
  @ApiOperation({
    summary: 'Join with a paid joining order — returns Razorpay checkout details',
    description:
      'The mobile must be verified with OTP first. Nothing is created until the payment is verified ' +
      '(POST /api/public/join/verify, or GET /api/public/join/status/:razorpayOrderId).',
  })
  @ApiResponse({ status: 201, description: 'PAYMENT_REQUIRED with Razorpay checkout details.' })
  @ApiResponse({ status: 400, description: 'Mobile not verified, out of stock or sponsor slots full.' })
  @ApiResponse({ status: 409, description: 'Email or mobile already in use.' })
  async join(@Body() dto: JoinWithOrderDto) {
    return this.onboardingService.joinWithOrder(dto);
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 20, message: 'Too many payment verification requests.' })
  @Post('verify')
  @ApiOperation({ summary: 'Verify the Razorpay payment of a join and create the VEDORA ID' })
  async verifyPayment(@Body() dto: VerifyJoinPaymentDto) {
    return this.onboardingService.verifySelfJoinPayment(dto);
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 30, message: 'Too many status checks. Please wait a moment.' })
  @Get('status/:razorpayOrderId')
  @ApiOperation({ summary: 'Status of a join payment (registers the partner once Razorpay confirms it)' })
  async status(@Param('razorpayOrderId') razorpayOrderId: string) {
    return this.onboardingService.selfJoinStatus(razorpayOrderId);
  }
}
