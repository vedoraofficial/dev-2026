import { useQuery } from "@tanstack/react-query"

import {
  approveWithdrawal,
  getAllWithdrawals,
  getMyWithdrawals,
  getWalletSummary,
  getWalletTransactions,
  rejectWithdrawal,
  requestWithdrawal,
} from "@/features/wallet/api"
import type {
  TransactionsQuery,
  WalletTransaction,
  WithdrawalStatus,
} from "@/features/wallet/types"
import { paiseToRupees } from "@/lib/money"
import { useApiMutation } from "@/lib/mutation"

export const walletKeys = {
  all: ["wallet"] as const,
  summary: ["wallet", "summary"] as const,
  transactions: (q: TransactionsQuery) => ["wallet", "transactions", q] as const,
  withdrawals: ["wallet", "withdrawals"] as const,
  adminWithdrawals: (status?: WithdrawalStatus) => ["wallet", "admin-withdrawals", status] as const,
}

export const useWalletSummary = () =>
  useQuery({ queryKey: walletKeys.summary, queryFn: getWalletSummary })

export const useWalletTransactions = (query: TransactionsQuery = {}) =>
  useQuery({
    queryKey: walletKeys.transactions(query),
    queryFn: () => getWalletTransactions(query),
  })

export const useMyWithdrawals = () =>
  useQuery({ queryKey: walletKeys.withdrawals, queryFn: getMyWithdrawals })

export const useRequestWithdrawal = () =>
  useApiMutation(requestWithdrawal, {
    success: (r) => `Withdrawal of ${r.withdrawal.amountFormatted} requested`,
    invalidate: [walletKeys.all],
  })

/** [Admin] */
export const useAllWithdrawals = (status?: WithdrawalStatus) =>
  useQuery({
    queryKey: walletKeys.adminWithdrawals(status),
    queryFn: () => getAllWithdrawals(status),
  })

export const useApproveWithdrawal = () =>
  useApiMutation(approveWithdrawal, {
    success: "Withdrawal approved",
    invalidate: [walletKeys.all],
  })

export const useRejectWithdrawal = () =>
  useApiMutation(rejectWithdrawal, {
    success: "Withdrawal rejected — amount returned to the wallet",
    invalidate: [walletKeys.all],
  })

/** Credits grouped the way the income screens show them. Amounts in rupees. */
export type IncomeSummary = {
  direct: number
  /** Level 1–5 BV income, index 0 = Level 1 */
  levels: number[]
  total: number
  commissions: WalletTransaction[]
}

const LEVEL_CATEGORIES = [
  "COMMISSION_LEVEL_1",
  "COMMISSION_LEVEL_2",
  "COMMISSION_LEVEL_3",
  "COMMISSION_LEVEL_4",
  "COMMISSION_LEVEL_5",
] as const

export function summarizeIncome(items: WalletTransaction[]): IncomeSummary {
  const commissions = items.filter((t) => t.category.startsWith("COMMISSION_"))
  const sumOf = (category: string) =>
    paiseToRupees(
      commissions.filter((t) => t.category === category).reduce((s, t) => s + Number(t.amount), 0),
    )
  const direct = sumOf("COMMISSION_DIRECT")
  const levels = LEVEL_CATEGORIES.map(sumOf)
  return { direct, levels, total: direct + levels.reduce((a, b) => a + b, 0), commissions }
}

/**
 * Commission income in a date range (all of it when no range), read from the wallet's credit
 * history in one large page — the backend has no income-summary endpoint.
 */
export const useCommissionIncome = (range: { fromDate?: string; toDate?: string } = {}) =>
  useQuery({
    queryKey: ["wallet", "income", range],
    queryFn: async () =>
      summarizeIncome(
        (await getWalletTransactions({ type: "CREDIT", limit: 1000, page: 1, ...range })).items,
      ),
  })
