import { IsNotEmpty, IsInt, Min, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entity/order.entity';

export class CreateOrderDto {
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

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod, example: PaymentMethod.PHONEPE })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
