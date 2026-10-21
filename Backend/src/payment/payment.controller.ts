import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Request,
  UseGuards,
  Param,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaymentService } from './payment.service';
import { PaymentReconciliationService } from './reconciliation.service';
import { OrderService } from '../order/order.service';
import { TopupWalletDto } from '../wallet/dto/topup-wallet.dto';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
    private readonly reconciliationService: PaymentReconciliationService,
  ) {}

  // ─── 1. Initiate Razorpay Payment for an Order ─────────────────────

  @Post('initiate/:orderId')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many payment initiation requests. Please wait a moment.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Razorpay checkout for a pending order' })
  async initiatePayment(@Param('orderId', ParseIntPipe) orderId: number, @Request() req: any) {
    // Verify the order belongs to this user
    const order = await this.orderService.getOrderById(orderId, req.user.sub);
    const result = await this.paymentService.initiatePayment(orderId);

    return {
      message: 'Payment initiated. Open Razorpay checkout modal.',
      ...result,
      orderId: Number(order.id),
      merchantOrderId: result.orderId,
      redirectUrl: `/payment/status?merchantOrderId=${encodeURIComponent(result.orderId)}`,
    };
  }

  // ─── 2. Initiate Wallet Top-up (Add-Money) ─────────────────────────

  @Post('topup')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many top-up initiation requests. Please wait a moment.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate wallet add-money (top-up) via Razorpay' })
  async initiateTopup(@Request() req: any, @Body() dto: TopupWalletDto) {
    const result = await this.paymentService.initiateTopup(req.user.sub, dto.amount);
    return {
      message: 'Top-up initiated. Open Razorpay checkout modal.',
      ...result,
      merchantOrderId: result.orderId,
      redirectUrl: `/payment/status?merchantOrderId=${encodeURIComponent(result.orderId)}`,
    };
  }

  // ─── 3. Verify Razorpay Payment Signature ──────────────────────────

  @Post('verify')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 20, message: 'Too many payment verification requests.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment signature for order or wallet top-up' })
  async verifyPayment(
    @Body() dto: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    return this.paymentService.verifyPayment(dto);
  }

  // ─── 4. Razorpay Webhook (Server-to-Server) ────────────────────────

  @Get('webhook')
  @ApiOperation({ summary: 'Health check / validation for Razorpay webhook' })
  async verifyWebhookEndpoint() {
    return { status: 'SUCCESS', message: 'Razorpay webhook endpoint is active' };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Razorpay server-to-server webhook' })
  async handleWebhook(@Body() payload: any, @Request() req: any) {
    this.logger.log('Razorpay webhook received');
    const signature = req.headers?.['x-razorpay-signature'];
    return this.paymentService.handleWebhook(payload, req.rawBody, signature);
  }

  // ─── 5. Manual Status Check ────────────────────────────────────────

  @Get('status/:merchantOrderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually check payment status for an order or top-up' })
  async checkStatus(@Param('merchantOrderId') merchantOrderId: string, @Request() req: any) {
    return this.paymentService.checkAndProcessPayment(merchantOrderId, 'STATUS_CHECK', req.user);
  }

  // ─── 6. Payment Reconciliation (Admin Only) ───────────────────────

  @Post('reconcile')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Trigger reconciliation for stale pending payments' })
  async reconcile(@Query('olderThanMinutes') olderThanMinutes?: number) {
    return this.reconciliationService.reconcilePendingPayments(
      olderThanMinutes ? Number(olderThanMinutes) : 10,
    );
  }
}
