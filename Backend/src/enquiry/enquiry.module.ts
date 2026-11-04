import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enquiry } from './entity/enquiry.entity';
import { EnquiryService } from './enquiry.service';
import { EnquiryController } from './enquiry.controller';
import { EnquiryPublicController } from './enquiry-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Enquiry])],
  controllers: [EnquiryController, EnquiryPublicController],
  providers: [EnquiryService],
})
export class EnquiryModule {}
