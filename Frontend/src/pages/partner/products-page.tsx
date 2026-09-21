import { useState } from "react"

import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { products, type Product } from "@/features/products/mock-data"
import { formatBV, formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const paymentOptions = ["Pay from wallet", "UPI / Card", "Net banking"] as const

/** Per-unit payout for a sale, as returned by the commission engine (sample values). */
const perUnit = { toYou: 300, toUpline: 300 }

type Cart = Partial<Record<Product["slug"], number>>

export function PartnerProductsPage() {
  const [cart, setCart] = useState<Cart>({ protection: 2, wealth: 1 })
  const [payment, setPayment] = useState<(typeof paymentOptions)[number]>("UPI / Card")

  const lines = products
    .filter((p) => (cart[p.slug] ?? 0) > 0)
    .map((p) => ({ product: p, qty: cart[p.slug] ?? 0 }))
  const units = lines.reduce((sum, l) => sum + l.qty, 0)
  const total = lines.reduce((sum, l) => sum + l.qty * l.product.price, 0)

  const add = (slug: Product["slug"]) => setCart((c) => ({ ...c, [slug]: (c[slug] ?? 0) + 1 }))

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Buy stock to sell · every unit generates 1,000 BV"
        actions={
          <>
            <Button variant="outline">Order history</Button>
            <Button>Cart · {units} items</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-4 sm:grid-cols-2 md:gap-5">
            {products.map((p) => (
              <article
                key={p.sku}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  width={1000}
                  height={750}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex items-end justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h2 className="text-[0.9375rem] font-semibold">{p.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{p.gemstones.join(" · ")}</p>
                    <p className="mt-1 font-mono text-xs text-gold-light">
                      {formatINR(p.price)} · {formatBV(p.bv)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => add(p.slug)}
                    aria-label={`Add ${p.name} to order`}
                  >
                    Add
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <h2 className="mb-4 text-[0.9375rem] font-semibold">Your order</h2>
              {lines.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Your order is empty. Add a bracelet to begin.
                </p>
              ) : (
                <ul className="space-y-2.5 border-b border-border/70 pb-4 text-[0.8125rem]">
                  {lines.map(({ product, qty }) => (
                    <li key={product.slug} className="flex justify-between gap-3">
                      <span className="text-foreground/85">
                        {product.shortName} × {qty}
                      </span>
                      <span className="font-mono">{formatINR(product.price * qty)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <dl className="space-y-2.5 py-4 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">BV generated</dt>
                  <dd className="font-mono text-gold">{formatBV(units * 1000)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">GST</dt>
                  <dd className="font-mono text-muted-foreground">Incl. as per Indian law</dd>
                </div>
              </dl>
              <div className="flex items-baseline justify-between border-t border-border/70 pt-4">
                <span className="text-[0.8125rem] font-semibold">Total payable</span>
                <span className="font-display text-3xl">{formatINR(total)}</span>
              </div>

              <div
                role="radiogroup"
                aria-label="Payment method"
                className="mt-4 grid grid-cols-3 gap-2"
              >
                {paymentOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={payment === option}
                    onClick={() => setPayment(option)}
                    className={cn(
                      "rounded-xl border px-1.5 py-2.5 text-[0.6875rem] leading-tight font-medium transition-colors",
                      payment === option
                        ? "border-gold/60 bg-gold/10 text-gold-light"
                        : "border-border text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <Button size="lg" className="mt-4 w-full" disabled={units === 0}>
                Checkout
              </Button>
              <p className="mt-3 text-center text-[0.625rem] text-muted-foreground">
                Prepaid only · UPI, cards, net banking. No COD.
                <br />
                Secured by Razorpay · PhonePe
              </p>
            </Panel>

            <Panel>
              <p className="mb-3 eyebrow text-gold">Commission on this order</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Each unit sold pays you ₹200 direct commission plus ₹100 as Level 1 BV income; a
                further ₹300 goes to Levels 2–5 above you. ₹600 distributed per sale.
              </p>
              <dl className="mt-4 space-y-2.5 border-t border-border/70 pt-4 text-[0.8125rem]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">You earn on {formatNumber(units)} units</dt>
                  <dd className="font-mono text-success">{formatINR(units * perUnit.toYou)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Upline distribution</dt>
                  <dd className="font-mono text-gold-light">
                    {formatINR(units * perUnit.toUpline)}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
