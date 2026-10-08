import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StockService } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@ApiTags('Stock')
@ApiBearerAuth()
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Received, sold and available stock per product' })
  summary() {
    return this.stockService.summary();
  }

  @Get('movements')
  @ApiOperation({ summary: '[Admin] Stock history (stock added / sales recorded), newest first' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  movements(@Query('productId') productId?: string, @Query('limit') limit?: string) {
    return this.stockService.movements(productId ? Number(productId) : undefined, limit ? Number(limit) : undefined);
  }

  @Post('movements')
  @ApiOperation({ summary: '[Admin] Add received stock (IN) or record sold stock (OUT)' })
  addMovement(@Request() req: any, @Body() dto: CreateStockMovementDto) {
    return this.stockService.addMovement(req.user.sub, dto);
  }
}
