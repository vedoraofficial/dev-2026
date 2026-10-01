import { IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RequestWithdrawalDto {
  @ApiProperty({ description: 'Withdrawal amount in rupees (e.g. 500 for ₹500)', example: 500 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(100, { message: 'Minimum withdrawal amount is ₹100.' })
  amount: number;

  @ApiProperty({ description: 'Bank account ID to receive the payout', example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  bankId: number;
}
