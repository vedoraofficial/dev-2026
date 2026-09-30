import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '../../user/dto/profile-details.dto';

export class JoinPartnerDto {
  @ApiProperty({ example: 'VED000001', description: 'Referral VED ID of the direct sponsor/parent' })
  @IsString()
  @IsNotEmpty()
  referralId: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the partner' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '9876543210', description: 'Mobile number' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ example: 'Secret@123', description: 'Password' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  // Extended profile details
  @ApiProperty({ example: '1995-05-20', description: 'Date of Birth (YYYY-MM-DD)', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: Gender.MALE, enum: Gender, required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: '45 Green Park', required: false })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiProperty({ example: 'Near Metro Station', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Delhi', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Delhi', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '110016', required: false })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  profilePhoto?: string;
}
