import { useQuery } from "@tanstack/react-query"

import {
  cancelOrder,
  createCashOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
} from "@/features/orders/api"
import { useApiMutation } from "@/lib/mutation"

export const orderKeys = {
  all: ["orders"] as const,
  mine: ["orders", "mine"] as const,
  one: (id: number) => ["orders", id] as const,
  admin: ["orders", "admin"] as const,
}

export const useMyOrders = () => useQuery({ queryKey: orderKeys.mine, queryFn: getMyOrders })

export const useOrder = (id: number | null) =>
  useQuery({
    queryKey: orderKeys.one(id ?? 0),
    queryFn: () => getOrder(id ?? 0),
    enabled: !!id,
  })

export const useCreateOrder = () => useApiMutation(createOrder, { invalidate: [orderKeys.all] })

/** [Admin] */
export const useAllOrders = () => useQuery({ queryKey: orderKeys.admin, queryFn: getAllOrders })

export const useCreateCashOrder = () =>
  useApiMutation(createCashOrder, {
    success: "Cash order created — commissions distributed",
    invalidate: [orderKeys.all, ["wallet"]],
  })

/** Cancel an order. A paid one (Admin) is refunded to the wallet and its stock returned. */
export const useCancelOrder = () =>
  useApiMutation(cancelOrder, {
    success: (r) => r.message || "Order cancelled",
    invalidate: [orderKeys.all, ["wallet"], ["stock"]],
  })
