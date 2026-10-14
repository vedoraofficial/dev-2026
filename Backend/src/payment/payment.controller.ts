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

  // ─── Initiate Payment for an Order ─────────────────────────────────

  @Post('initiate/:orderId')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many payment initiation requests. Please wait a moment.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate PhonePe payment for a pending order' })
  async initiatePayment(@Param('orderId', ParseIntPipe) orderId: number, @Request() req: any) {
    // Verify the order belongs to this user
    const order = await this.orderService.getOrderById(orderId, req.user.sub);
    const result = await this.paymentService.initiatePayment(orderId);

    return {
      message: 'Payment initiated. Redirect the user to the provided URL.',
      redirectUrl: result.redirectUrl,
      merchantOrderId: result.merchantOrderId,
      orderId: Number(order.id),
    };
  }

  // ─── Initiate Wallet Top-up (Add-Money) ─────────────────────────────

  @Post('topup')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many top-up initiation requests. Please wait a moment.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate wallet add-money (top-up) via PhonePe' })
  async initiateTopup(@Request() req: any, @Body() dto: TopupWalletDto) {
    const result = await this.paymentService.initiateTopup(req.user.sub, dto.amount);
    return {
      message: 'Top-up initiated. Redirect the user to the provided URL.',
      redirectUrl: result.redirectUrl,
      merchantOrderId: result.merchantOrderId,
      amount: result.amount,
    };
  }

  // ─── PhonePe Callback (Redirect from PhonePe) ─────────────────────

  @Get('callback')
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 30, message: 'Too many callback requests. Please wait a moment.' })
  @ApiOperation({ summary: 'Handle PhonePe redirect callback (after user completes payment)' })
  @ApiQuery({ name: 'merchantOrderId', required: true })
  async handleCallback(@Query('merchantOrderId') merchantOrderId: string) {
    this.logger.log(`PhonePe callback received for merchantOrderId: ${merchantOrderId}`);
    return this.paymentService.handleCallback(merchantOrderId);
  }

  // ─── PhonePe Webhook (Server-to-Server) ────────────────────────────

  @Post('webhook')
  @ApiOperation({ summary: 'Handle PhonePe server-to-server webhook' })
  async handleWebhook(@Body() payload: any, @Request() req: any) {
    this.logger.log('PhonePe webhook received');
    const authHeader = req.headers?.['authorization'] || req.headers?.['x-verify'];
    return this.paymentService.handleWebhook(payload, req.rawBody, authHeader);
  }

  // ─── Manual Status Check ───────────────────────────────────────────

  @Get('status/:merchantOrderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually check payment status for an order' })
  async checkStatus(@Param('merchantOrderId') merchantOrderId: string, @Request() req: any) {
    return this.paymentService.checkAndProcessPayment(merchantOrderId, 'STATUS_CHECK', req.user);
  }

  // ─── Payment Reconciliation (Admin Only) ──────────────────────────

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
