import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { BRACELET_PRICE, type Bracelet, stoneLine } from "@/website/features/products/catalog"
import { formatINR } from "@/website/lib/format"

/** Collection tile on the home page: image, intention, name, stones, price. */
export function ProductCard({ bracelet }: { bracelet: Bracelet }) {
  return (
    <Link
      to={`${ROUTES.products}#${bracelet.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-gold/40"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={bracelet.image}
          alt={bracelet.name}
          loading="lazy"
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="kicker text-[0.5625rem] tracking-[0.22em]">{bracelet.intention}</p>
        <h3 className="mt-2.5 font-display text-[1.375rem] leading-tight font-normal">
          {bracelet.name}
        </h3>
        <p className="mt-1.5 text-[0.75rem] text-muted-foreground">{stoneLine(bracelet)}</p>
        <p className="mt-auto pt-4 text-[0.8125rem] font-bold text-gold">
          {formatINR(BRACELET_PRICE)}
        </p>
      </div>
    </Link>
  )
}
