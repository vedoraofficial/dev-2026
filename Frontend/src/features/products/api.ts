import type { ApiProduct, ProductInput } from "@/features/products/types"
import { api } from "@/lib/api"
import { env } from "@/lib/env"
import { AppError } from "@/lib/errors"
import { makeProductPhoto } from "@/lib/image"

// The backend sends bigint columns as numbers or strings — normalise once here.
const toProduct = (p: ApiProduct): ApiProduct => ({
  ...p,
  id: Number(p.id),
  mrp: Number(p.mrp),
  salePrice: Number(p.salePrice),
  bvAmount: Number(p.bvAmount),
  stockAvailable: Number(p.stockAvailable ?? 0),
})

/** GET /api/product */
export async function getProducts(): Promise<ApiProduct[]> {
  const { data } = await api.get<ApiProduct[]>("/product")
  return data.map(toProduct)
}

/** GET /api/public/products — no sign-in: products on sale, with stock (referral join page). */
export async function getPublicProducts(): Promise<ApiProduct[]> {
  const { data } = await api.get<ApiProduct[]>("/public/products")
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

/** Photos bigger than this aren't even opened (they're resized before upload anyway). */
const MAX_PICKED_BYTES = 20 * 1024 * 1024

/** POST /api/product/:id/image — [Admin] the photo is resized in the browser, then uploaded. */
export async function uploadProductImage({
  id,
  file,
}: {
  id: number
  file: File
}): Promise<ApiProduct> {
  if (!file.type.startsWith("image/")) throw new AppError("Choose an image file (JPG, PNG or WebP)")
  if (file.size > MAX_PICKED_BYTES) throw new AppError("Choose a photo smaller than 20 MB")
  const photo = await makeProductPhoto(file)
  const form = new FormData()
  form.append("image", photo, photo.type === "image/webp" ? "photo.webp" : "photo.jpg")
  const { data } = await api.post<ApiProduct>(`/product/${id}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return toProduct(data)
}

/** DELETE /api/product/:id/image — [Admin] back to the built-in artwork. */
export async function removeProductImage(id: number): Promise<ApiProduct> {
  const { data } = await api.delete<ApiProduct>(`/product/${id}/image`)
  return toProduct(data)
}

/**
 * Link to the photo Admin uploaded, or null when there is none. A new photo gets a new link
 * (?v=…), so browsers and the website show it straight away.
 */
export function productImageUrl(p: Pick<ApiProduct, "id" | "imageUpdatedAt">): string | null {
  if (!p.imageUpdatedAt) return null
  return `${env.apiBaseUrl}/public/products/${p.id}/image?v=${Date.parse(p.imageUpdatedAt)}`
}
