import { BRACELET_MRP, BRACELET_PRICE } from "@/website/features/products/catalog"
import { formatINR } from "@/website/lib/format"
import { cn } from "@/website/lib/utils"

/** Selling price with the MRP struck through beside it. Sizes follow the parent's font size. */
export function Price({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span>{formatINR(BRACELET_PRICE)}</span>
      <s className="text-[0.6em] font-normal text-muted-foreground decoration-1">
        <span className="sr-only">MRP </span>
        {formatINR(BRACELET_MRP)}
      </s>
    </span>
  )
}
