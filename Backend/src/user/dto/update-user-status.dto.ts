import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { UserStatus } from '../entity/user.entity';

export class UpdateUserStatusDto {
  @ApiPropertyOptional({ example: 5, description: 'Target user ID to update' })
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiProperty({ 
    example: UserStatus.PENDING, 
    enum: UserStatus,
    description: 'Update the user status (PENDING, ACTIVE, INACTIVE, BLOCKED)'
  })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
