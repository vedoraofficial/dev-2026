import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminCreateCashOrderDto } from './dto/admin-create-cash-order.dto';

@ApiTags('Orders')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ─── Partner Endpoints ──────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order (purchase a product)' })
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.sub, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my orders' })
  async getMyOrders(@Request() req: any) {
    return this.orderService.getMyOrders(req.user.sub);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details with commission breakdown' })
  async getOrderById(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    // Partners can only view their own orders; admin can view any
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.sub;
    return this.orderService.getOrderById(id, userId);
  }

  // ─── Admin Endpoints ───────────────────────────────────────────────

  @Post('admin/cash')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a cash/offline order for a partner' })
  async createCashOrder(@Request() req: any, @Body() dto: AdminCreateCashOrderDto) {
    return this.orderService.createCashOrder(req.user.sub, dto);
  }

  @Get('admin/all')
  @Roles('ADMIN')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List all orders' })
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }
}
