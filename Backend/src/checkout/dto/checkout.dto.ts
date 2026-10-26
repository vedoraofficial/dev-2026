import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { PaymentMethod } from '../../order/entity/order.entity';

export const CHECKOUT_PAYMENT_METHODS = [PaymentMethod.WALLET, PaymentMethod.RAZORPAY] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

export class CheckoutItemDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;
}

/** The whole cart: one payment, one invoice, one email. */
export class CheckoutDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one product.' })
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({ enum: CHECKOUT_PAYMENT_METHODS, example: PaymentMethod.WALLET })
  @IsIn(CHECKOUT_PAYMENT_METHODS)
  paymentMethod: CheckoutPaymentMethod;
}
