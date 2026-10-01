import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminWithdrawalActionDto {
  @ApiPropertyOptional({ description: 'Admin remarks (reason for rejection, etc.)', example: 'Bank details mismatch' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
