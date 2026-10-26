import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutService } from './checkout.service';

@ApiTags('Orders')
@Controller('order')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many checkout requests. Please wait a moment.' })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Buy the whole cart in one payment (one invoice and one email)',
    description:
      'WALLET: every product is ordered and paid in one go — or nothing is, if one fails. ' +
      'RAZORPAY: returns checkout details for one payment of the total; the orders are confirmed ' +
      'once it is verified (POST /api/payment/verify, or GET /api/payment/status/:razorpayOrderId).',
  })
  @ApiResponse({ status: 201, description: 'PAID (wallet) or PAYMENT_REQUIRED (Razorpay).' })
  @ApiResponse({ status: 400, description: 'Inactive / out of stock product or insufficient wallet balance.' })
  async checkout(@Request() req: any, @Body() dto: CheckoutDto) {
    return this.checkoutService.checkout(req.user.sub, dto);
  }
}
