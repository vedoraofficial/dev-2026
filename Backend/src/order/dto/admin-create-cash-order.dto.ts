import { IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Quantity (default 1, max 1000)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000, { message: 'Maximum purchase quantity is 1,000 units per order.' })
  quantity?: number = 1;
}
