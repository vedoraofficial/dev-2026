/** GET /api/stock — one row per product. `tracked` is false until stock is first added. */
export type StockRow = {
  productId: number
  name: string
  status: "ACTIVE" | "INACTIVE"
  tracked: boolean
  received: number
  sold: number
  available: number
  lastMovementAt: string | null
}

export type StockMovementType = "IN" | "OUT"

/** GET /api/stock/movements */
export type StockMovement = {
  id: number
  productId: number
  productName: string | null
  type: StockMovementType
  quantity: number
  note: string | null
  createdBy: { vedId: string; name: string } | null
  createdAt: string
}

/** POST /api/stock/movements — IN = stock received, OUT = sold */
export type StockMovementInput = {
  productId: number
  type: StockMovementType
  quantity: number
  note?: string
}

export type StockMovementResult = {
  message: string
  productId: number
  received: number
  sold: number
  available: number
}
