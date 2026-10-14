import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
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

  @ApiProperty({ example: 150000, description: 'Maximum Retail Price in paise (e.g. 150000 = ₹1,500.00)' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  mrp: number;

  @ApiProperty({ example: 120000, description: 'Actual Sale Price in paise (e.g. 120000 = ₹1,200.00)' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  salePrice: number;

  @ApiProperty({ example: 500, description: 'Business Volume amount for MLM calculations' })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  bvAmount: number;

  @ApiProperty({ example: ProductStatus.ACTIVE, enum: ProductStatus, required: false })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
