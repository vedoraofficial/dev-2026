import type { SrpLedgerEntry, SrpSummary } from "@/features/srp/types"
import { api } from "@/lib/api"

/** GET /api/srp */
export async function getSrpSummary(): Promise<SrpSummary> {
  const { data } = await api.get<SrpSummary>("/srp")
  return data
}

/** GET /api/srp/ledger */
export async function getSrpLedger(): Promise<SrpLedgerEntry[]> {
  const { data } = await api.get<SrpLedgerEntry[]>("/srp/ledger")
  return data
}
