import type {
  StockMovement,
  StockMovementInput,
  StockMovementResult,
  StockRow,
} from "@/features/stock/types"
import { api } from "@/lib/api"

/** GET /api/stock — [Admin] received / sold / available per product */
export async function getStock(): Promise<StockRow[]> {
  const { data } = await api.get<StockRow[]>("/stock")
  return data
}

/** GET /api/stock/movements — [Admin] stock history, newest first */
export async function getStockMovements(productId?: number): Promise<StockMovement[]> {
  const { data } = await api.get<StockMovement[]>("/stock/movements", {
    params: productId ? { productId } : undefined,
  })
  return data
}

/** POST /api/stock/movements — [Admin] add received stock or record a sale */
export async function addStockMovement(input: StockMovementInput): Promise<StockMovementResult> {
  const { data } = await api.post<StockMovementResult>("/stock/movements", input)
  return data
}
