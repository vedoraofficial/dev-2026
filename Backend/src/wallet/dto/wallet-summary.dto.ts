import { ApiProperty } from '@nestjs/swagger';

export class WalletSummaryDto {
  @ApiProperty({ description: 'Wallet ID' })
  id: number;

  @ApiProperty({ description: 'Available balance in paise' })
  availableBalance: number;

  @ApiProperty({ description: 'Available balance in rupees (formatted)' })
  availableBalanceFormatted: string;

  @ApiProperty({ description: 'Locked balance in paise (pending withdrawals)' })
  lockedBalance: number;

  @ApiProperty({ description: 'Locked balance formatted' })
  lockedBalanceFormatted: string;

  @ApiProperty({ description: 'Lifetime total earned in paise' })
  totalEarned: number;

  @ApiProperty({ description: 'Total earned formatted' })
  totalEarnedFormatted: string;

  @ApiProperty({ description: 'Lifetime total withdrawn in paise' })
  totalWithdrawn: number;

  @ApiProperty({ description: 'Total withdrawn formatted' })
  totalWithdrawnFormatted: string;
}
