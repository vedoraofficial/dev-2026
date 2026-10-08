import { products as artwork, type Product } from "@/features/products/mock-data"
import type { ApiProduct } from "@/features/products/types"
import { paiseToRupees } from "@/lib/money"

/**
 * The backend stores no images or gemstones, so a product picks up the artwork of the bracelet
 * its name mentions ("Protection", "Energy", "Wealth", "Balance"); anything else gets the first.
 */
export function productArt(name: string): Pick<Product, "image" | "gemstones" | "slug"> {
  const lower = name.toLowerCase()
  const match = artwork.find((a) => lower.includes(a.slug)) ?? artwork[0]
  return { image: match.image, gemstones: match.gemstones, slug: match.slug }
}

/** "PRD-007" — the label shown for a backend product. */
export const productCode = (id: number) => `PRD-${String(id).padStart(3, "0")}`

/** A backend product in the shape the shared ProductCard / pickers use (prices in rupees). */
export function toCatalogProduct(p: ApiProduct, unitsSold = 0): Product {
  const art = productArt(p.name)
  return {
    ...art,
    sku: productCode(p.id),
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
