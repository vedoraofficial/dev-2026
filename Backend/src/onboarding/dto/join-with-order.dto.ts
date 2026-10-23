import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { RegisterWithOrderDto } from './register-with-order.dto';
import { SendMobileOtpDto, VerifyMobileOtpDto } from './mobile-otp.dto';

/**
 * Referral join page: the new partner plus their joining order, paid online by the new partner.
 * They are placed in the sponsor's lowest free slot once the payment succeeds.
 */
export class JoinWithOrderDto extends OmitType(RegisterWithOrderDto, [
  'paymentMethod',
  'slotNumber',
  'parentVedId',
  'productSku',
] as const) {
  @ApiProperty({ example: 'VED000001', description: 'VEDORA ID from the referral link — the sponsor' })
  @IsString()
  @IsNotEmpty()
  referralId: string;
}

export class JoinSendOtpDto extends SendMobileOtpDto {
  @ApiProperty({ example: 'VED000001', description: 'VEDORA ID from the referral link — the sponsor' })
  @IsString()
  @IsNotEmpty()
  referralId: string;
}

export class JoinVerifyOtpDto extends VerifyMobileOtpDto {
  @ApiProperty({ example: 'VED000001', description: 'VEDORA ID from the referral link — the sponsor' })
  @IsString()
  @IsNotEmpty()
  referralId: string;
}

/** What Razorpay's checkout handler returns on the join page. */
export class VerifyJoinPaymentDto {
  @ApiProperty({ example: 'order_Ab12Cd34Ef56Gh' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({ example: 'pay_Ab12Cd34Ef56Gh' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({ example: '9f2c…' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
