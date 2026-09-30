import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Gender } from '../../user/dto/profile-details.dto';

export class RegisterPartnerBySponsorDto {
  @ApiProperty({ example: 'Alice Smith', description: 'Full name of the new partner' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'alice.smith@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '9876543211', description: 'Mobile number' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ example: 'Secret@123', description: 'Password' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 3,
    description: 'Manual slot position (1 to 20). If omitted, the lowest available slot is automatically assigned.',
    required: false,
    minimum: 1,
    maximum: 20,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  slotNumber?: number;

  // Extended profile details
  @ApiProperty({ example: '1996-07-15', description: 'Date of Birth (YYYY-MM-DD)', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: Gender.FEMALE, enum: Gender, required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 'Flat 102, Sunrise Towers', required: false })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiProperty({ example: 'MG Road', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Bengaluru', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Karnataka', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '560001', required: false })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiProperty({ example: 'https://example.com/alice.jpg', required: false })
  @IsString()
  @IsOptional()
  profilePhoto?: string;
}
