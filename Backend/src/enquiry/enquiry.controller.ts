import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EnquiryStatus } from './entity/enquiry.entity';
import { UpdateEnquiryStatusDto } from './dto/create-enquiry.dto';
import { EnquiryService } from './enquiry.service';

@ApiTags('Enquiries')
@ApiBearerAuth()
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enquiries')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Messages sent from the website contact page, newest first' })
  @ApiQuery({ name: 'status', required: false, enum: EnquiryStatus })
  findAll(@Query('status') status?: string) {
    const parsed = Object.values(EnquiryStatus).includes(status as EnquiryStatus)
      ? (status as EnquiryStatus)
      : undefined;
    return this.enquiryService.findAll(parsed);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[Admin] Mark a message as contacted (or back to new)' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEnquiryStatusDto) {
    return this.enquiryService.updateStatus(id, dto.status);
  }
}
