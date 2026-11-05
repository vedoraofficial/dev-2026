import { useQuery } from "@tanstack/react-query"

import { getSrpLedger, getSrpSummary } from "@/features/srp/api"

export const srpKeys = {
  all: ["srp"] as const,
  summary: ["srp", "summary"] as const,
  ledger: ["srp", "ledger"] as const,
}

export const useSrpSummary = () =>
  useQuery({ queryKey: srpKeys.summary, queryFn: getSrpSummary })

export const useSrpLedger = () =>
  useQuery({ queryKey: srpKeys.ledger, queryFn: getSrpLedger })
