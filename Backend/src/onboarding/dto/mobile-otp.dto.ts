import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class SendMobileOtpDto {
  @ApiProperty({ example: '9876543211', description: "New partner's 10-digit mobile number" })
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number.' })
  mobile: string;
}

export class VerifyMobileOtpDto extends SendMobileOtpDto {
  @ApiProperty({ example: '123456', description: 'The 6-digit OTP sent to the mobile number' })
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit OTP.' })
  otp: string;
}
