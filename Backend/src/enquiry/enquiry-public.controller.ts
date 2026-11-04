import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { EnquiryService } from './enquiry.service';

/** No sign-in needed — the website's contact page. */
@ApiTags('Public')
@Controller('public/enquiries')
export class EnquiryPublicController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 5, message: 'Too many messages. Please wait 1 minute.' })
  @Post()
  @ApiOperation({ summary: 'Public: send a message from the website contact page' })
  create(@Body() dto: CreateEnquiryDto) {
    return this.enquiryService.create(dto);
  }
}
