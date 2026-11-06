/** GET /api/bv */
export type BvSummary = {
  balance: number
}

/** GET /api/bv/ledger */
export type BvLedgerEntry = {
  id: number
  amount: number
  balanceAfter: number
  fromUser: { vedId: string; name: string } | null
  referenceType: string | null
  referenceId: string | null
  createdAt: string
}
