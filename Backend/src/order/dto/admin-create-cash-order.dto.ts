import { IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCreateCashOrderDto {
  @ApiProperty({ description: 'User ID of the partner making the purchase', example: 5 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiProperty({ description: 'Product ID to purchase', example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  productId: number;

  @ApiPropertyOptional({ description: 'Quantity (default 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}
