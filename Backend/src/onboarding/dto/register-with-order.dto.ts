import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { RegisterPartnerBySponsorDto } from '../../genealogy/dto/register-partner-by-sponsor.dto';
import { PaymentMethod } from '../../order/entity/order.entity';

/** PAY_LATER: the partner is created now with an inactive ID and pays the joining order from My Orders */
export const PAY_LATER = 'PAY_LATER' as const;
export const JOINING_PAYMENT_METHODS = [PaymentMethod.WALLET, PaymentMethod.RAZORPAY, PAY_LATER] as const;
export type JoiningPaymentMethod = (typeof JOINING_PAYMENT_METHODS)[number];

/**
 * A new downline partner plus their joining order. The sponsor pays (wallet or Razorpay); the
 * partner is created only once the payment succeeds. The address is required because the
 * joining order ships to it; the date of birth because partners must be 18 or older.
 */
export class RegisterWithOrderDto extends OmitType(RegisterPartnerBySponsorDto, [
  'dateOfBirth',
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
    description:
      "WALLET debits the sponsor's wallet at once; RAZORPAY returns Razorpay checkout details; " +
      'PAY_LATER creates the partner now (ID inactive) — the partner pays the joining order from My Orders',
  })
  @IsIn(JOINING_PAYMENT_METHODS)
  paymentMethod: JoiningPaymentMethod;

  @ApiProperty({ example: '1996-07-15', description: 'Date of birth (YYYY-MM-DD) — must be 18 or older today' })
  @IsDateString({}, { message: 'Enter a valid date of birth.' })
  @IsNotEmpty({ message: 'Date of birth is required.' })
  dateOfBirth: string;

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
