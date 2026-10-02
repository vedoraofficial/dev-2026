import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AnnouncementTarget {
  ALL = 'ALL',
  ALL_PARTNERS = 'ALL_PARTNERS',
  FOUNDER_TEAM = 'FOUNDER_TEAM',
}

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Special Festive Commission Bonus!', description: 'Title of the announcement' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Earn 5% extra on all sales this week.', description: 'Announcement body text' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    enum: AnnouncementTarget,
    default: AnnouncementTarget.ALL,
    description: 'Target audience: ALL partners or a specific FOUNDER_TEAM',
  })
  @IsEnum(AnnouncementTarget)
  @IsOptional()
  target?: AnnouncementTarget = AnnouncementTarget.ALL;

  @ApiPropertyOptional({
    example: 'VED000001',
    description: 'Founder VED ID if target is FOUNDER_TEAM',
  })
  @IsString()
  @IsOptional()
  founderVedId?: string;
}
