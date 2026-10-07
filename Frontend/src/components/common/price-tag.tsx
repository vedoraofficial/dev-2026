import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Selling price, with the MRP beside it struck through when the MRP is higher.
 * Prices in rupees. When MRP and selling price are the same, only the price shows.
 */
export function PriceTag({
  price,
  mrp,
  className,
  mrpClassName,
}: {
  price: number
  mrp?: number | null
  className?: string
  mrpClassName?: string
}) {
  const showMrp = mrp != null && mrp > price
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span>{formatINR(price)}</span>
      {showMrp ? (
        <s className={cn("text-[0.85em] font-normal text-muted-foreground", mrpClassName)}>
          <span className="sr-only">MRP </span>
          {formatINR(mrp)}
        </s>
      ) : null}
    </span>
  )
}
