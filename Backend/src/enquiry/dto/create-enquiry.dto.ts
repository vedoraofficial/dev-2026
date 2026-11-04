import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ENQUIRY_TOPICS, EnquiryStatus } from '../entity/enquiry.entity';
import type { EnquiryTopic } from '../entity/enquiry.entity';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** The website's "Send us a message" form. */
export class CreateEnquiryDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @Transform(trim)
  @IsString()
  @MinLength(3, { message: 'Enter your full name.' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '9876543210', description: '10-digit mobile number' })
  @Transform(trim)
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number.' })
  mobile: string;

  @ApiProperty({ example: 'rahul@example.com' })
  @Transform(trim)
  @IsEmail({}, { message: 'Enter a valid email.' })
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 'VED000123', required: false, description: 'Order or Partner ID, if any' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  reference?: string;

  @ApiProperty({ enum: ENQUIRY_TOPICS, example: 'Order' })
  @IsIn(ENQUIRY_TOPICS, { message: 'Choose a topic.' })
  topic: EnquiryTopic;

  @ApiProperty({ example: 'My order has not arrived yet.' })
  @Transform(trim)
  @IsString()
  @MinLength(10, { message: 'Tell us a little more (at least 10 characters).' })
  @MaxLength(2000)
  message: string;
}

export class UpdateEnquiryStatusDto {
  @ApiProperty({ enum: EnquiryStatus, example: EnquiryStatus.CONTACTED })
  @IsEnum(EnquiryStatus)
  status: EnquiryStatus;
}
