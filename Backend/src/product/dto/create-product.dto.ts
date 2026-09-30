import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../entity/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'Vedora Health Supplement', description: 'Name of the product' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A premium health supplement to boost immunity.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1500, description: 'Maximum Retail Price' })
  @IsNumber()
  @IsNotEmpty()
  mrp: number;

  @ApiProperty({ example: 1200, description: 'Actual Sale Price' })
  @IsNumber()
  @IsNotEmpty()
  salePrice: number;

  @ApiProperty({ example: 500, description: 'Business Volume amount for MLM calculations' })
  @IsNumber()
  @IsNotEmpty()
  bvAmount: number;

  @ApiProperty({ example: ProductStatus.ACTIVE, enum: ProductStatus, required: false })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
