import { braceletArtwork } from "@/features/products/artwork"
import { productImageUrl } from "@/features/products/api"
import type { ApiProduct, Product } from "@/features/products/types"
import { paiseToRupees } from "@/lib/money"

/**
 * The backend stores no images or gemstones, so a product picks up the artwork of the bracelet
 * its name mentions ("Protection", "Energy", "Wealth", "Balance"); anything else gets the first.
 */
export function productArt(name: string): Pick<Product, "image" | "gemstones" | "slug"> {
  const lower = name.toLowerCase()
  const match = braceletArtwork.find((a) => lower.includes(a.slug)) ?? braceletArtwork[0]
  return { image: match.image, gemstones: match.gemstones, slug: match.slug }
}

/** The product's SKU ("VED-PYRITE-003"); "PRD-007" only for a product saved before SKUs existed. */
export const productCode = (p: Pick<ApiProduct, "id" | "sku">) =>
  p.sku || `PRD-${String(p.id).padStart(3, "0")}`

/** A backend product in the shape the shared ProductCard / pickers use (prices in rupees). */
export function toCatalogProduct(p: ApiProduct, unitsSold = 0): Product {
  const art = productArt(p.name)
  return {
    ...art,
    // The photo Admin uploaded, otherwise the bracelet artwork
    image: productImageUrl(p) ?? art.image,
    id: p.id,
    sku: productCode(p),
    name: p.name,
    shortName: p.name.replace(/^VEDORA\s+/i, ""),
    price: paiseToRupees(p.salePrice),
    mrp: paiseToRupees(p.mrp),
    stock: p.stockAvailable ?? null,
    bv: p.bvAmount,
    description: p.description ?? "",
    unitsSold,
    status: p.status === "ACTIVE" ? "live" : "draft",
  }
}

/** Nothing left to order (no stock added yet also counts as 0). */
export const isOutOfStock = (p: { stock?: number | null }) => p.stock != null && p.stock <= 0

/** Units per product id from a list of paid orders — "sold" on the product cards. */
export function unitsByProduct(
  orders: { product: { id: number }; quantity: number; paymentStatus: string }[],
): Map<number, number> {
  const sold = new Map<number, number>()
  for (const o of orders) {
    if (o.paymentStatus !== "PAID") continue
    sold.set(o.product.id, (sold.get(o.product.id) ?? 0) + o.quantity)
  }
  return sold
}
