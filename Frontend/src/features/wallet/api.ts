import type {
  AdminWithdrawal,
  Paginated,
  TransactionsQuery,
  WalletSummary,
  WalletTransaction,
  WithdrawalStatus,
  Withdrawal,
  WithdrawInput,
} from "@/features/wallet/types"
import { api } from "@/lib/api"

/** GET /api/wallet */
export async function getWalletSummary(): Promise<WalletSummary> {
  const { data } = await api.get<WalletSummary>("/wallet")
  return data
}

/** GET /api/wallet/transactions */
export async function getWalletTransactions(
  query: TransactionsQuery = {},
): Promise<Paginated<WalletTransaction>> {
  const { data } = await api.get<Paginated<WalletTransaction>>("/wallet/transactions", {
    params: query,
  })
  return data
}

/** POST /api/wallet/withdraw */
export async function requestWithdrawal(
  input: WithdrawInput,
): Promise<{ message: string; withdrawal: Withdrawal }> {
  const { data } = await api.post<{ message: string; withdrawal: Withdrawal }>(
    "/wallet/withdraw",
    input,
  )
  return data
}

/** GET /api/wallet/withdrawals */
export async function getMyWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await api.get<Withdrawal[]>("/wallet/withdrawals")
  return data
}

/** GET /api/wallet/admin/withdrawals — [Admin] */
export async function getAllWithdrawals(status?: WithdrawalStatus): Promise<AdminWithdrawal[]> {
  const { data } = await api.get<AdminWithdrawal[]>("/wallet/admin/withdrawals", {
    params: status ? { status } : undefined,
  })
  return data
}

/** PATCH /api/wallet/admin/withdrawal/:id/approve — [Admin] */
export async function approveWithdrawal(id: number): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>(`/wallet/admin/withdrawal/${id}/approve`)
  return data
}

/** PATCH /api/wallet/admin/withdrawal/:id/reject — [Admin] */
export async function rejectWithdrawal({
  id,
  remarks,
}: {
  id: number
  remarks?: string
}): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>(`/wallet/admin/withdrawal/${id}/reject`, {
    remarks,
  })
  return data
}
