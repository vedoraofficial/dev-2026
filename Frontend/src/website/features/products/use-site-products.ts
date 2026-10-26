import { productImageUrl } from "@/features/products/api"
import { usePublicProducts } from "@/features/products/queries"
import type { ApiProduct } from "@/features/products/types"
import { paiseToRupees } from "@/lib/money"
import {
  BRACELETS,
  type Bracelet,
  type BraceletDetail,
  type Gemstone,
} from "@/website/features/products/catalog"

/** A product Admin put on sale, as the website shows it. Prices in rupees. */
export type SiteProduct = {
  id: number
  /** Anchor on the products page (#protection, or #p-12 for a new product) */
  slug: string
  name: string
  /** Short style tag above the name, e.g. "Black Onyx & Tiger Eye"; a general one for new products */
  style: string
  description: string
  details: readonly BraceletDetail[]
  stones: readonly Gemstone[]
  image: string
  price: number
  mrp: number
  inStock: boolean
}

/**
 * The backend stores name, description, price, stock and the photo Admin uploaded — not gemstone
 * details. A product whose name mentions one of the four bracelets (old or new name) keeps that
 * bracelet's details (and its photo when Admin hasn't uploaded one); anything else gets the first
 * photo until Admin uploads its own.
 */
const KEYWORDS: Record<Bracelet["slug"], string[]> = {
  protection: ["protection", "pyrite"],
  energy: ["energy", "citrine"],
  wealth: ["wealth", "tiger"],
  balance: ["balance", "quartz"],
}

/** Heading above the name of a product that isn't one of the four known bracelets */
const NEW_PRODUCT_STYLE = "Natural gemstone bracelet"

function knownBracelet(name: string): Bracelet | undefined {
  const lower = name.toLowerCase()
  return BRACELETS.find((b) => KEYWORDS[b.slug].some((k) => lower.includes(k)))
}

function toSiteProduct(p: ApiProduct, usedSlugs: Set<string>): SiteProduct {
  const known = knownBracelet(p.name)
  // Two products can match the same bracelet — keep anchors unique.
  const slug = known && !usedSlugs.has(known.slug) ? known.slug : `p-${p.id}`
  usedSlugs.add(slug)
  return {
    id: p.id,
    slug,
    name: p.name,
    style: known?.style ?? NEW_PRODUCT_STYLE,
    description: p.description?.trim() || known?.description || "",
    details: known?.details ?? [],
    stones: known?.stones ?? [],
    // The photo Admin uploaded in Products, otherwise the bracelet's built-in photo
    image: productImageUrl(p) ?? known?.image ?? BRACELETS[0].image,
    price: paiseToRupees(p.salePrice),
    mrp: paiseToRupees(p.mrp),
    inStock: (p.stockAvailable ?? 0) > 0,
  }
}

/** GET /api/public/products — what Admin has put live in Products, with live stock. */
export function useSiteProducts() {
  const query = usePublicProducts()
  const usedSlugs = new Set<string>()
  const products = (query.data ?? []).map((p) => toSiteProduct(p, usedSlugs))
  return { ...query, products }
}

/** Lowest selling price on the site, with its MRP (the "from" price in the heroes). */
export function lowestPrice(products: SiteProduct[]): { price: number; mrp: number } | null {
  if (!products.length) return null
  return products.reduce((low, p) => (p.price < low.price ? p : low))
}
