import { IsOptional, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionCategory } from '../entity/wallet-transaction.entity';

export class WalletTransactionsQueryDto {
  @ApiPropertyOptional({ enum: TransactionType, description: 'Filter by CREDIT or DEBIT' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiPropertyOptional({ description: 'From date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
