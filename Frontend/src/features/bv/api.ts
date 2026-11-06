import type { BvLedgerEntry, BvSummary } from "@/features/bv/types"
import { api } from "@/lib/api"

/** GET /api/bv */
export async function getBvSummary(): Promise<BvSummary> {
  const { data } = await api.get<BvSummary>("/bv")
  return data
}

/** GET /api/bv/ledger */
export async function getBvLedger(): Promise<BvLedgerEntry[]> {
  const { data } = await api.get<BvLedgerEntry[]>("/bv/ledger")
  return data
}
