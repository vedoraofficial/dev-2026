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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from './payment.service';
import { OrderService } from '../order/order.service';
import { PaymentMethod } from '../order/entity/order.entity';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
  ) {}

  // ─── Initiate Payment for an Order ─────────────────────────────────

  @Post('initiate/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate PhonePe payment for a pending order' })
  async initiatePayment(@Param('orderId') orderId: number, @Request() req: any) {
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

  // ─── PhonePe Callback (Redirect from PhonePe) ─────────────────────

  @Get('callback')
  @ApiOperation({ summary: 'Handle PhonePe redirect callback (after user completes payment)' })
  @ApiQuery({ name: 'merchantOrderId', required: true })
  async handleCallback(@Query('merchantOrderId') merchantOrderId: string) {
    this.logger.log(`PhonePe callback received for merchantOrderId: ${merchantOrderId}`);
    return this.paymentService.handleCallback(merchantOrderId);
  }

  // ─── PhonePe Webhook (Server-to-Server) ────────────────────────────

  @Post('webhook')
  @ApiOperation({ summary: 'Handle PhonePe server-to-server webhook' })
  async handleWebhook(@Body() payload: any) {
    this.logger.log('PhonePe webhook received');
    return this.paymentService.handleWebhook(payload);
  }

  // ─── Manual Status Check ───────────────────────────────────────────

  @Get('status/:merchantOrderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually check payment status for an order' })
  async checkStatus(@Param('merchantOrderId') merchantOrderId: string) {
    return this.paymentService.checkAndProcessPayment(merchantOrderId, 'STATUS_CHECK');
  }
}
