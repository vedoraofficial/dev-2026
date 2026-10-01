import type { ApiProduct, ProductInput } from "@/features/products/types"
import { api } from "@/lib/api"

// The backend sends bigint columns as numbers or strings — normalise once here.
const toProduct = (p: ApiProduct): ApiProduct => ({
  ...p,
  id: Number(p.id),
  mrp: Number(p.mrp),
  salePrice: Number(p.salePrice),
  bvAmount: Number(p.bvAmount),
})

/** GET /api/product */
export async function getProducts(): Promise<ApiProduct[]> {
  const { data } = await api.get<ApiProduct[]>("/product")
  return data.map(toProduct)
}

/** GET /api/product/:id */
export async function getProduct(id: number): Promise<ApiProduct> {
  const { data } = await api.get<ApiProduct>(`/product/${id}`)
  return toProduct(data)
}

/** POST /api/product — [Admin] */
export async function createProduct(input: ProductInput): Promise<ApiProduct> {
  const { data } = await api.post<ApiProduct>("/product", input)
  return toProduct(data)
}

/** PATCH /api/product/:id — [Admin] */
export async function updateProduct({
  id,
  ...input
}: Partial<ProductInput> & { id: number }): Promise<ApiProduct> {
  const { data } = await api.patch<ApiProduct>(`/product/${id}`, input)
  return toProduct(data)
}

/** DELETE /api/product/:id — [Admin] */
export async function deleteProduct(id: number): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/product/${id}`)
  return data
}
