import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BankVerificationStatus } from '../entity/user-bank.entity';

export class AdminVerifyBankDto {
  @ApiProperty({ enum: BankVerificationStatus, description: 'Target verification status (VERIFIED / REJECTED / PENDING)' })
  @IsEnum(BankVerificationStatus)
  status: BankVerificationStatus;

  @ApiProperty({ required: false, description: 'Reason or remarks for this verification action' })
  @IsOptional()
  @IsString()
  reason?: string;
}
