import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Request,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { InvoiceService } from './invoice.service';

@ApiTags('Invoices')
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @ApiBearerAuth()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin/sales-register')
  @ApiOperation({
    summary: '[Admin] Sales register for the CA — paid orders in a date range with their GST split',
    description: 'from / to are dates (YYYY-MM-DD, India time), both included. Amounts in paise.',
  })
  salesRegister(@Query('from') from: string, @Query('to') to: string) {
    const valid = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!valid(from) || !valid(to)) throw new BadRequestException('Give from and to as YYYY-MM-DD.');
    // Whole days in India time: from 00:00 on `from` to the end of `to`
    const start = new Date(`${from}T00:00:00+05:30`);
    const end = new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 24 * 60 * 60 * 1000 - 1);
    if (start > end) throw new BadRequestException('from must be on or before to.');
    return this.invoiceService.salesRegister(start, end);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Download the GST invoice (PDF) of a paid order — the buyer or Admin' })
  @ApiResponse({ status: 400, description: 'Order not paid yet.' })
  @ApiResponse({ status: 403, description: "Not the buyer's order." })
  async download(@Param('orderId', ParseIntPipe) orderId: number, @Request() req: any) {
    const { invoice, pdf } = await this.invoiceService.pdfForUser(orderId, req.user);
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${this.invoiceService.fileName(invoice)}"`,
    });
  }
}
