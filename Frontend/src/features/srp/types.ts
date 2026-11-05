/** GET /api/srp */
export type SrpSummary = {
  balance: number
  totalEarned: number
  totalRedeemed: number
  monthsRedeemable: number
}

export type SrpTransactionType = "EARN" | "DEDUCT"

export type SrpReason = "PARTNER_JOIN_SALE" | "SELF_PURCHASE" | "MONTHLY_AUTO_DEDUCT"

/** GET /api/srp/ledger */
export type SrpLedgerEntry = {
  id: number
  type: SrpTransactionType
  reason: SrpReason
  amount: number
  balanceAfter: number
  referenceType: string | null
  referenceId: string | null
  description: string | null
  createdAt: string
}
