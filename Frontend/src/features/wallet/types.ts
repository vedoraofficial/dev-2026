/** All amounts below are in paise unless the name says otherwise (`…Formatted` is the backend's text). */

/** GET /api/wallet */
export type WalletSummary = {
  id: number
  availableBalance: number
  availableBalanceFormatted: string
  lockedBalance: number
  lockedBalanceFormatted: string
  totalEarned: number
  totalEarnedFormatted: string
  totalWithdrawn: number
  totalWithdrawnFormatted: string
}

export type TransactionType = "CREDIT" | "DEBIT"

export type TransactionCategory =
  | "COMMISSION_DIRECT"
  | "COMMISSION_LEVEL_1"
  | "COMMISSION_LEVEL_2"
  | "COMMISSION_LEVEL_3"
  | "COMMISSION_LEVEL_4"
  | "COMMISSION_LEVEL_5"
  | "PRODUCT_PURCHASE"
  | "WITHDRAWAL"
  | "WITHDRAWAL_REVERSAL"
  | "ADMIN_CREDIT"
  | "ADMIN_DEBIT"
  | "REFUND"

export type WalletTransaction = {
  id: number
  type: TransactionType
  category: TransactionCategory
  amount: number
  amountFormatted: string
  balanceAfter: number
  balanceAfterFormatted: string
  referenceType: string | null
  referenceId: string | number | null
  description: string | null
  createdAt: string
}

/** GET /api/wallet/transactions query */
export type TransactionsQuery = {
  type?: TransactionType
  category?: TransactionCategory
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export type Paginated<T> = {
  items: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export type WithdrawalStatus = "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED"

type WithdrawalBank = { id?: number; bankName: string; accountNumber: string; ifscCode: string }

/** GET /api/wallet/withdrawals */
export type Withdrawal = {
  id: number
  amount: number
  amountFormatted: string
  status: WithdrawalStatus
  bank: WithdrawalBank | null
  adminRemarks: string | null
  processedAt: string | null
  createdAt: string
}

/** GET /api/wallet/admin/withdrawals — [Admin] */
export type AdminWithdrawal = Withdrawal & {
  user: { id: number; vedId: string; name: string }
  adminUser: { id: number; vedId: string; name: string } | null
}

/** POST /api/wallet/withdraw — `amount` in rupees (minimum ₹100); the bank must be VERIFIED. */
export type WithdrawInput = { amount: number; bankId: number }
