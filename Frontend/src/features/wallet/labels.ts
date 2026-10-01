import type { PillVariant } from "@/components/common/status-pill"
import type { TransactionCategory, WithdrawalStatus } from "@/features/wallet/types"

/** Readable names for the backend's transaction categories. */
export const categoryLabel: Record<TransactionCategory, string> = {
  COMMISSION_DIRECT: "Direct commission",
  COMMISSION_LEVEL_1: "Level 1 commission",
  COMMISSION_LEVEL_2: "Level 2 commission",
  COMMISSION_LEVEL_3: "Level 3 commission",
  COMMISSION_LEVEL_4: "Level 4 commission",
  COMMISSION_LEVEL_5: "Level 5 commission",
  PRODUCT_PURCHASE: "Product purchase",
  WITHDRAWAL: "Withdrawal",
  WITHDRAWAL_REVERSAL: "Withdrawal reversed",
  ADMIN_CREDIT: "Admin credit",
  ADMIN_DEBIT: "Admin debit",
  REFUND: "Refund",
}

export const COMMISSION_CATEGORIES: TransactionCategory[] = [
  "COMMISSION_DIRECT",
  "COMMISSION_LEVEL_1",
  "COMMISSION_LEVEL_2",
  "COMMISSION_LEVEL_3",
  "COMMISSION_LEVEL_4",
  "COMMISSION_LEVEL_5",
]

export const withdrawalPill: Record<WithdrawalStatus, { label: string; variant: PillVariant }> = {
  PENDING: { label: "Pending", variant: "pending" },
  APPROVED: { label: "Approved", variant: "gold" },
  PROCESSING: { label: "Processing", variant: "gold" },
  COMPLETED: { label: "Completed", variant: "success" },
  REJECTED: { label: "Rejected", variant: "danger" },
}

/** "HDFC Bank ****4821" */
export const maskedBank = (bank: { bankName: string; accountNumber: string } | null | undefined) =>
  bank ? `${bank.bankName} ****${bank.accountNumber.slice(-4)}` : "—"
