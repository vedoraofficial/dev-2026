import { Controller, Get, Param, ParseIntPipe, Request, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoiceService } from './invoice.service';

@ApiTags('Invoices')
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

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
