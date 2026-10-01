import { useQuery, useQueryClient } from "@tanstack/react-query"

import { getAllOrders, getOrder } from "@/features/orders/api"
import { orderKeys } from "@/features/orders/queries"
import { mapLimit } from "@/lib/async"
import { paiseToRupees } from "@/lib/money"

/** One commission paid on one order. Amount in rupees. */
export type LedgerEntry = {
  id: string
  orderId: number
  date: string
  seller: { vedId: string; name: string }
  recipient: { vedId: string; name: string }
  /** 0 = direct ₹200, 1–5 = BV levels */
  level: number
  rate: string
  amount: number
}

/**
 * [Admin] Every commission the engine has paid, read from each paid order's details
 * (GET /api/order/:id) — the backend has no network-wide commission report.
 */
export function useCommissionLedger() {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: [...orderKeys.admin, "ledger"],
    queryFn: async () => {
      const orders = await queryClient.fetchQuery({
        queryKey: orderKeys.admin,
        queryFn: getAllOrders,
        staleTime: 30_000,
      })
      const paid = orders.filter((o) => o.paymentStatus === "PAID" && o.commissionsDistributed)
      const details = await mapLimit(paid, 6, (o) =>
        queryClient.fetchQuery({
          queryKey: orderKeys.one(o.id),
          queryFn: () => getOrder(o.id),
          staleTime: 5 * 60_000,
        }),
      )
      return details.flatMap((d): LedgerEntry[] =>
        d.commissions.map((c) => ({
          id: `${d.id}-${c.level}-${c.beneficiary.vedId}`,
          orderId: Number(d.id),
          date: d.createdAt,
          seller: { vedId: d.user.vedId, name: d.user.name },
          recipient: { vedId: c.beneficiary.vedId, name: c.beneficiary.name },
          level: c.level,
          rate: c.commissionRate,
          amount: paiseToRupees(c.amount),
        })),
      )
    },
  })
}

export const ledgerLevelLabel = (level: number) =>
  level === 0 ? "Direct ₹200" : `Level ${level} BV`
