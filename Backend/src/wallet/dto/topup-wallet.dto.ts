import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class TopupWalletDto {
  @ApiProperty({
    example: 100000,
    description: 'Amount to add to wallet in paise (e.g. 100000 = ₹1,000.00; min ₹100 = 10000, max ₹5,00,000 = 50000000)',
  })
  @IsInt()
  @Min(10000, { message: 'Minimum topup amount is ₹100 (10,000 paise).' })
  @Max(50000000, { message: 'Maximum single topup amount is ₹5,00,000 (50,000,000 paise).' })
  @IsNotEmpty()
  amount: number;
}

