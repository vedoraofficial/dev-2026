import { BRACELET_MRP, BRACELET_PRICE } from "@/website/features/products/catalog"
import { formatINR } from "@/website/lib/format"
import { cn } from "@/website/lib/utils"

/**
 * Selling price with the MRP struck through beside it (only when the MRP is higher). Sizes follow
 * the parent's font size. In rupees; the standard bracelet price when not given.
 */
export function Price({
  className,
  price = BRACELET_PRICE,
  mrp = BRACELET_MRP,
}: {
  className?: string
  price?: number
  mrp?: number
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span>{formatINR(price)}</span>
      {mrp > price ? (
        <s className="text-[0.6em] font-normal text-muted-foreground decoration-1">
          <span className="sr-only">MRP </span>
          {formatINR(mrp)}
        </s>
      ) : null}
    </span>
  )
}
