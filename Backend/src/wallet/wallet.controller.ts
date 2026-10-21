import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WalletService } from './wallet.service';
import { PaymentService } from '../payment/payment.service';
import { WalletTransactionsQueryDto } from './dto/wallet-transactions-query.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { AdminWithdrawalActionDto } from './dto/admin-withdrawal-action.dto';
import { WithdrawalStatus } from './entity/withdrawal.entity';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  // ─── Partner Endpoints ──────────────────────────────────────────────

  @Post('topup')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many topup requests. Please try again later.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate wallet add-money (top-up) via Razorpay gateway' })
  async initiateTopup(@Request() req: any, @Body() dto: TopupWalletDto) {
    return this.paymentService.initiateTopup(req.user.sub, dto.amount);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my wallet summary (balance, earned, withdrawn)' })
  async getMyWallet(@Request() req: any) {
    return this.walletService.getWalletSummary(req.user.sub);
  }

  @Get('transactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my wallet transaction history (paginated, filterable)' })
  async getMyTransactions(@Request() req: any, @Query() query: WalletTransactionsQueryDto) {
    return this.walletService.getTransactions(req.user.sub, query);
  }

  @Post('withdraw')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many withdrawal requests. Please try again later.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request withdrawal to verified bank account (min ₹100)' })
  async requestWithdrawal(@Request() req: any, @Body() dto: RequestWithdrawalDto) {
    return this.walletService.requestWithdrawal(req.user.sub, dto.amount, dto.bankId);
  }

  @Get('withdrawals')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my withdrawal history' })
  async getMyWithdrawals(@Request() req: any) {
    return this.walletService.getMyWithdrawals(req.user.sub);
  }

  // ─── Admin Endpoints ───────────────────────────────────────────────

  @Get('admin/withdrawals')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List all withdrawals (optionally filter by status)' })
  @ApiQuery({ name: 'status', enum: WithdrawalStatus, required: false })
  async getAllWithdrawals(@Query('status') status?: WithdrawalStatus) {
    return this.walletService.getAllWithdrawals(status);
  }

  @Patch('admin/withdrawal/:id/approve')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Approve a pending withdrawal' })
  async approveWithdrawal(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.walletService.approveWithdrawal(id, req.user.sub);
  }

  @Patch('admin/withdrawal/:id/reject')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Reject a pending withdrawal with optional remarks' })
  async rejectWithdrawal(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: AdminWithdrawalActionDto,
  ) {
    return this.walletService.rejectWithdrawal(id, req.user.sub, dto.remarks);
  }

  @Post('admin/withdrawal/:id/sync')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Sync payout status from RazorpayX for a withdrawal' })
  async syncWithdrawalPayout(@Param('id', ParseIntPipe) id: number) {
    return this.walletService.syncWithdrawalPayout(id);
  }

  @Post('admin/withdrawals/sync')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Sync all active/approved withdrawals with RazorpayX' })
  async syncAllActiveWithdrawals() {
    return this.walletService.syncAllActiveWithdrawals();
  }
}
