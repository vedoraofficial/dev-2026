import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'VED108', description: 'The VED ID of the user' })
  @IsString()
  @IsNotEmpty()
  vedId: string;

  @ApiProperty({ example: '123456', description: 'The 6-digit OTP or reset token received' })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({ example: 'NewSecret@123', description: 'The new password (min 6 chars)' })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
