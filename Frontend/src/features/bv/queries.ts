import { useQuery } from "@tanstack/react-query"

import { getBvLedger, getBvSummary } from "@/features/bv/api"

export const bvKeys = {
  all: ["bv"] as const,
  summary: ["bv", "summary"] as const,
  ledger: ["bv", "ledger"] as const,
}

export const useBvSummary = () => useQuery({ queryKey: bvKeys.summary, queryFn: getBvSummary })

export const useBvLedger = () => useQuery({ queryKey: bvKeys.ledger, queryFn: getBvLedger })
