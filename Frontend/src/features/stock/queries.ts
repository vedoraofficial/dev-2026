import { useQuery } from "@tanstack/react-query"

import { addStockMovement, getStock, getStockMovements } from "@/features/stock/api"
import { useApiMutation } from "@/lib/mutation"

export const stockKeys = {
  all: ["stock"] as const,
  summary: ["stock", "summary"] as const,
  movements: (productId?: number) => ["stock", "movements", productId ?? "all"] as const,
}

export const useStock = () => useQuery({ queryKey: stockKeys.summary, queryFn: getStock })

export const useStockMovements = (productId?: number) =>
  useQuery({
    queryKey: stockKeys.movements(productId),
    queryFn: () => getStockMovements(productId),
  })

/** Product lists carry the stock too, so they refresh with it. */
export const useAddStockMovement = () =>
  useApiMutation(addStockMovement, {
    success: (r, v) =>
      `${v.type === "IN" ? "Stock added" : "Sale recorded"} · ${r.available} available`,
    invalidate: [stockKeys.all, ["products"]],
  })
