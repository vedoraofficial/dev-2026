import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddBankDetailsDto {
  @ApiProperty({ example: 'Rahul Sharma', description: 'Name as registered in the bank' })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @ApiProperty({ example: '12345678901234', description: 'Bank account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: 'HDFC Bank', description: 'Name of the bank' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ example: 'HDFC0001234', description: 'Bank IFSC Code' })
  @IsString()
  @IsNotEmpty()
  ifscCode: string;

  @ApiProperty({ example: true, description: 'Set as primary bank account', required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
