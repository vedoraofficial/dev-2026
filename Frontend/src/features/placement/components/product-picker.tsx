import { Check } from "lucide-react"

import { MonoId } from "@/components/common/mono-id"
import { PriceTag } from "@/components/common/price-tag"
import { formatBV } from "@/lib/format"
import { cn } from "@/lib/utils"

/** What the picker needs from a product (the page passes the catalogue in). */
export type PickerProduct = {
  sku: string
  shortName: string
  image: string
  gemstones: string[]
  price: number
  mrp?: number
  bv: number
}

type Props = {
  products: PickerProduct[]
  value: string
  onChange: (sku: string) => void
  invalid?: boolean
  className?: string
}

/** The 4 bracelets as selectable cards — the new partner's joining order. */
export function ProductPicker({ products, value, onChange, invalid, className }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Product"
      aria-invalid={invalid || undefined}
      className={cn("grid grid-cols-2 gap-2.5", className)}
    >
      {products.map((p) => {
        const selected = p.sku === value
        return (
          <button
            key={p.sku}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(p.sku)}
            className={cn(
              "relative flex min-w-0 flex-col overflow-hidden rounded-xl border text-left transition-colors",
              selected
                ? "border-gold bg-gold/10 ring-3 ring-gold/20"
                : "border-border bg-field/60 hover:border-gold/40",
            )}
          >
            <img
              src={p.image}
              alt=""
              loading="lazy"
              width={1000}
              height={750}
              className="aspect-[4/3] w-full object-cover"
            />
            {selected ? (
              <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-gold text-primary-foreground">
                <Check className="size-3.5" />
              </span>
            ) : null}
            <span className="flex flex-col gap-0.5 p-2.5">
              <MonoId tone="gold" className="text-[0.625rem]">
                {p.sku}
              </MonoId>
              <span className="truncate text-[0.8125rem] font-medium">{p.shortName}</span>
              <span className="truncate text-[0.625rem] text-muted-foreground">
                {p.gemstones.join(" · ")}
              </span>
              <span className="font-mono text-[0.6875rem] text-gold-light">
                <PriceTag price={p.price} mrp={p.mrp} /> · {formatBV(p.bv)}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
