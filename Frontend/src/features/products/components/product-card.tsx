import { useState } from "react"

import { MonoId } from "@/components/common/mono-id"
import { Panel } from "@/components/common/panel"
import { StatusPill } from "@/components/common/status-pill"
import { Input } from "@/components/ui/input"
import type { Product } from "@/features/products/mock-data"
import { formatBV, formatNumber } from "@/lib/format"
import { truncateWords } from "@/lib/text"

const PREVIEW_WORDS = 32

/**
 * One SKU in the catalogue — shared by the Admin and Partner Products pages.
 * `soldLabel` is the line at the bottom: all sales for Admin, the signed-in partner's own for Partners.
 */
export function ProductCard({ product: p, soldLabel }: { product: Product; soldLabel: string }) {
  const [expanded, setExpanded] = useState(false)
  const preview = truncateWords(p.description, PREVIEW_WORDS)
  const hasMore = preview !== p.description

  return (
    <Panel className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-5 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <img
        src={p.image}
        alt={p.name}
        loading="lazy"
        width={1000}
        height={750}
        className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
      />

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <MonoId tone="gold" className="text-[0.6875rem]">
            {p.sku}
          </MonoId>
          <StatusPill variant={p.status === "live" ? "success" : "neutral"}>
            {p.status === "live" ? "Live" : "Draft"}
          </StatusPill>
        </div>

        <Input defaultValue={p.name} aria-label={`${p.sku} name`} />
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Input defaultValue={`₹ ${formatNumber(p.price)}`} aria-label={`${p.sku} price`} />
          <Input
            defaultValue={formatBV(p.bv)}
            aria-label={`${p.sku} BV`}
            className="font-mono text-gold"
          />
        </div>

        <div className="rounded-xl border border-border bg-field/60 p-3.5">
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {expanded ? p.description : preview}
          </p>
          {hasMore ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-3 text-[0.6875rem] font-medium text-gold hover:underline"
            >
              {expanded ? "Show less ←" : "Read more →"}
            </button>
          ) : null}
        </div>

        <p className="mt-auto text-xs text-muted-foreground">{soldLabel}</p>
      </div>
    </Panel>
  )
}
