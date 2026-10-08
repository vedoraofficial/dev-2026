export type ProductStatus = "ACTIVE" | "INACTIVE"

/** GET /api/product — `mrp` and `salePrice` are in paise, `bvAmount` in BV (1 BV = ₹1). */
export type ApiProduct = {
  id: number
  name: string
  description: string | null
  mrp: number
  salePrice: number
  bvAmount: number
  status: ProductStatus
  /** Units left — 0 (out of stock) until Admin adds stock */
  stockAvailable?: number | null
  createdAt: string
  updatedAt: string
}

/** POST /api/product (Admin). Prices in paise. */
export type ProductInput = {
  name: string
  description?: string
  mrp: number
  salePrice: number
  bvAmount: number
  status?: ProductStatus
}
