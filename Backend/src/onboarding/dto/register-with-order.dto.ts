import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { AADHAAR_PATTERN, PAN_PATTERN, RegisterPartnerBySponsorDto } from '../../genealogy/dto/register-partner-by-sponsor.dto';
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
  'pan',
  'aadhaar',
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

  @ApiProperty({ example: 'ABCDE1234F', description: 'PAN card — one PAN per VEDORA ID' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(PAN_PATTERN, { message: 'Enter a valid PAN, e.g. ABCDE1234F.' })
  pan: string;

  @ApiProperty({ example: '123456789012', description: 'Aadhaar card — 12 digits' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @Matches(AADHAAR_PATTERN, { message: 'Aadhaar is 12 digits.' })
  aadhaar: string;

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

  // Shipping address for the joining order — when left out, it ships to the address above.
  @ApiProperty({ example: 'Alice Smith', required: false, description: "Receiver's name, if different from the partner" })
  @IsString()
  @IsOptional()
  shippingName?: string;

  @ApiProperty({ example: '9876543211', required: false })
  @IsString()
  @IsOptional()
  shippingMobile?: string;

  @ApiProperty({ example: 'Flat 102, Sunrise Towers', required: false })
  @IsString()
  @IsOptional()
  shippingAddressLine1?: string;

  @ApiProperty({ example: 'Near City Hospital', required: false })
  @IsString()
  @IsOptional()
  shippingLandmark?: string;

  @ApiProperty({ example: 'Koramangala', required: false })
  @IsString()
  @IsOptional()
  shippingArea?: string;

  @ApiProperty({ example: 'Bengaluru', required: false })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiProperty({ example: 'Karnataka', required: false })
  @IsString()
  @IsOptional()
  shippingState?: string;

  @ApiProperty({ example: '560001', required: false })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Shipping pincode must be 6 digits.' })
  shippingPincode?: string;
}
