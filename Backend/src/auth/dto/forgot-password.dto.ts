import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'VED108', description: 'The VED ID of the user requesting a password reset' })
  @IsString()
  @IsNotEmpty()
  vedId: string;
}
