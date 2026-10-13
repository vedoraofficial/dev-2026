import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ShiprocketService } from './shiprocket.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { OrderTrackingResponseDto } from './dto/tracking-response.dto';
import { UserRole } from '../user/entity/user.entity';

@ApiTags('Shipping & Tracking (Shiprocket)')
@Controller('shipping')
export class ShiprocketController {
  constructor(private readonly shiprocketService: ShiprocketService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('track/order/:orderId')
  @ApiOperation({
    summary: 'Track parcel for an order (Customer / Admin)',
    description:
      'Returns UI progress stepper, courier details, and detailed checkpoint scans. Validates that customer owns the order unless admin.',
  })
  @ApiParam({ name: 'orderId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Tracking details retrieved successfully.',
    type: OrderTrackingResponseDto,
  })
  async getOrderTracking(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Request() req: any,
  ): Promise<OrderTrackingResponseDto> {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    return this.shiprocketService.getOrderTracking(orderId, req.user?.sub, isAdmin);
  }

  @Get('track/public/:awbCode')
  @ApiOperation({
    summary: 'Public parcel tracking by AWB tracking number',
    description: 'Allows tracking a shipment publicly via AWB without authentication.',
  })
  @ApiParam({ name: 'awbCode', type: String, example: '142231908234' })
  @ApiResponse({
    status: 200,
    description: 'Live tracking data for AWB.',
    type: OrderTrackingResponseDto,
  })
  async getPublicTracking(@Param('awbCode') awbCode: string): Promise<OrderTrackingResponseDto> {
    return this.shiprocketService.getPublicTracking(awbCode);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('shipment/create')
  @ApiOperation({
    summary: 'Create Shiprocket shipment and assign courier AWB (Admin)',
    description:
      'Pushes order details & customer address to Shiprocket, assigns courier, generates AWB, and updates order to SHIPPED.',
  })
  @ApiResponse({ status: 201, description: 'Shipment created and AWB assigned successfully.' })
  async createShipment(@Body() dto: CreateShipmentDto, @Request() req: any) {
    return this.shiprocketService.createAndAssignShipment(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('track/sync/:awbCode')
  @ApiOperation({
    summary: 'Force live tracking refresh from Shiprocket API',
    description: 'Manually triggers live fetch from Shiprocket and refreshes database cache.',
  })
  @ApiParam({ name: 'awbCode', type: String, example: '142231908234' })
  async syncTracking(@Param('awbCode') awbCode: string) {
    return this.shiprocketService.syncTrackingByAwb(awbCode);
  }

  @Post('webhook/tracking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Shiprocket Tracking Webhook endpoint',
    description:
      'Destination URL to configure in Shiprocket Dashboard (Settings > Webhooks). Receives real-time scan updates and marks orders delivered.',
  })
  @ApiResponse({ status: 200, description: 'Webhook received.' })
  async handleTrackingWebhook(@Body() payload: any) {
    return this.shiprocketService.processWebhook(payload);
  }
}
