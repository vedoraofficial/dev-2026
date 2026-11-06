import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BvService } from './bv.service';

@ApiTags('BV')
@Controller('bv')
export class BvController {
  constructor(private readonly bvService: BvService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my BV points balance' })
  async getMySummary(@Request() req: any) {
    return this.bvService.getSummary(req.user.sub);
  }

  @Get('ledger')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my BV ledger (newest first)' })
  async getMyLedger(@Request() req: any) {
    return this.bvService.getLedger(req.user.sub);
  }
}
