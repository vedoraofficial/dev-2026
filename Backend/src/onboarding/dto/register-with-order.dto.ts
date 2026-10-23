import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { RegisterPartnerBySponsorDto } from '../../genealogy/dto/register-partner-by-sponsor.dto';
import { PaymentMethod } from '../../order/entity/order.entity';

export const JOINING_PAYMENT_METHODS = [PaymentMethod.WALLET, PaymentMethod.RAZORPAY] as const;
export type JoiningPaymentMethod = (typeof JOINING_PAYMENT_METHODS)[number];

/**
 * A new downline partner plus their joining order. The sponsor pays (wallet or Razorpay); the
 * partner is created only once the payment succeeds. The address is required because the
 * joining order ships to it.
 */
export class RegisterWithOrderDto extends OmitType(RegisterPartnerBySponsorDto, [
  'addressLine1',
  'city',
  'state',
  'pincode',
] as const) {
  @ApiProperty({ example: 3, description: 'Joining product' })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    enum: JOINING_PAYMENT_METHODS,
    example: PaymentMethod.WALLET,
    description: "WALLET debits the sponsor's wallet at once; RAZORPAY returns Razorpay checkout details",
  })
  @IsIn(JOINING_PAYMENT_METHODS)
  paymentMethod: JoiningPaymentMethod;

  @ApiProperty({ example: 'Flat 102, Sunrise Towers' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({ example: 'Bengaluru' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '560001' })
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits.' })
  pincode: string;
}
