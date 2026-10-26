import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { stoneLine } from "@/website/features/products/catalog"
import { Price } from "@/website/features/products/components/price"
import type { SiteProduct } from "@/website/features/products/use-site-products"

/** Collection tile on the home page: image, style, name, stones, price. */
export function ProductCard({ bracelet }: { bracelet: SiteProduct }) {
  return (
    <Link
      to={`${ROUTES.products}#${bracelet.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-gold/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {bracelet.inStock ? null : <OutOfStock />}
        <img
          src={bracelet.image}
          alt={bracelet.name}
          loading="lazy"
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="kicker text-[0.5625rem] tracking-[0.22em]">{bracelet.style}</p>
        <h3 className="mt-2.5 font-display text-[1.375rem] leading-tight font-normal">
          {bracelet.name}
        </h3>
        {/* Known bracelets list their stones; a new product shows its description from Admin */}
        {bracelet.stones.length || bracelet.description ? (
          <p className="mt-1.5 line-clamp-2 text-[0.75rem] text-muted-foreground">
            {bracelet.stones.length ? stoneLine(bracelet) : bracelet.description}
          </p>
        ) : null}
        <p className="mt-auto pt-4 text-[0.8125rem] font-bold text-gold">
          <Price price={bracelet.price} mrp={bracelet.mrp} />
        </p>
      </div>
    </Link>
  )
}

/** Badge on the photo of a product with no stock left. */
export function OutOfStock() {
  return (
    <span className="absolute top-3 left-3 z-10 rounded-full bg-background/90 px-2.5 py-1 text-[0.625rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
      Out of stock
    </span>
  )
}

/** Placeholder tile while the products load. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2.5 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
