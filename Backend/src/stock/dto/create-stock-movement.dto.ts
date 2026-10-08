import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { StockMovementType } from '../entity/stock-movement.entity';

export class CreateStockMovementDto {
  @ApiProperty({ example: 4, description: 'Product ID' })
  @IsInt()
  productId: number;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN, description: 'IN = stock received, OUT = sold' })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 10, description: 'How many units' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Batch from supplier', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  note?: string;
}
