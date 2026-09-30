import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../user.entity';

export class UpdateUserStatusDto {
  @ApiProperty({ 
    example: UserStatus.PENDING, 
    enum: UserStatus,
    description: 'Update the user status (PENDING, ACTIVE, INACTIVE, BLOCKED)'
  })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
