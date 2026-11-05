import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SrpService } from './srp.service';

class RunMonthlyCheckDto {
  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

@ApiTags('SRP')
@Controller('srp')
export class SrpController {
  constructor(private readonly srpService: SrpService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my SRP wallet summary (balance, earned, redeemed)' })
  async getMySummary(@Request() req: any) {
    return this.srpService.getSummary(req.user.sub);
  }

  @Get('ledger')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my SRP ledger (newest first)' })
  async getMyLedger(@Request() req: any) {
    return this.srpService.getLedger(req.user.sub);
  }

  @Post('admin/run-monthly-check')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Manually run the no-sale monthly auto-deduct/deactivate check (defaults to last month)' })
  async runMonthlyCheck(@Body() dto: RunMonthlyCheckDto) {
    return this.srpService.runMonthlyCheckForMonth(dto.year, dto.month);
  }
}
