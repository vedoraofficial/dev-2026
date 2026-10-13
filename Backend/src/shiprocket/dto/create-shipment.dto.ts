import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ example: 1, description: 'Order ID to be shipped' })
  @IsInt()
  @IsPositive()
  orderId: number;

  @ApiProperty({ example: 10, description: 'Length of package in cm', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  length?: number;

  @ApiProperty({ example: 10, description: 'Breadth of package in cm', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  breadth?: number;

  @ApiProperty({ example: 10, description: 'Height of package in cm', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiProperty({ example: 0.5, description: 'Dead weight of package in kg', required: false, default: 0.5 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ example: 24, description: 'Specific Shiprocket Courier Company ID', required: false })
  @IsInt()
  @IsOptional()
  courierId?: number;
}
