import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/features/products/components/product-card"
import { partnerUnitsSold, products, type Product } from "@/features/products/mock-data"
import { formatBV, formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const paymentOptions = ["Pay from wallet", "UPI / Card", "Net banking"] as const

/** Per-unit payout for a sale, as returned by the commission engine (sample values). */
const perUnit = { toYou: 300, toUpline: 300 }

type Cart = Partial<Record<Product["slug"], number>>

/**
 * Same catalogue as Admin › Products (without the stat cards) — "sold" is this partner's own —
 * plus the partner's order panel so stock can be ordered from here.
 */
export function PartnerProductsPage() {
  const [cart, setCart] = useState<Cart>({ protection: 2, wealth: 1 })
  const [payment, setPayment] = useState<(typeof paymentOptions)[number]>("UPI / Card")
  // DUMMY: order numbers for checkouts made on this screen.
  const [nextOrderNo, setNextOrderNo] = useState(1205)

  const lines = products
    .filter((p) => (cart[p.slug] ?? 0) > 0)
    .map((p) => ({ product: p, qty: cart[p.slug] ?? 0 }))
  const units = lines.reduce((sum, l) => sum + l.qty, 0)
  const total = lines.reduce((sum, l) => sum + l.qty * l.product.price, 0)

  const add = (slug: Product["slug"]) => setCart((c) => ({ ...c, [slug]: (c[slug] ?? 0) + 1 }))

  // DUMMY: stands in for POST /api/partner/orders + payment.
  const checkout = () => {
    const orderId = `ORD-${String(nextOrderNo).padStart(5, "0")}`
    toast.success(`Order ${orderId} placed — ${formatINR(total)} via ${payment}`, {
      description: `${units} bracelet${units === 1 ? "" : "s"} · ${formatBV(units * 1000)}`,
    })
    setNextOrderNo((n) => n + 1)
    setCart({})
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Four SKUs · ₹1,999 MRP GST as per Indian law · 7-day manufacturing defect warranty"
        actions={
          <Button asChild variant="outline">
            <Link to={ROUTES.partner.orders}>Order history</Link>
          </Button>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4 md:space-y-5">
            {products.map((p) => {
              const inOrder = cart[p.slug] ?? 0
              return (
                <ProductCard
                  key={p.sku}
                  product={p}
                  soldLabel={`${partnerUnitsSold[p.sku] ?? 0} sold by you`}
                  action={
                    <Button
                      size="sm"
                      onClick={() => add(p.slug)}
                      aria-label={`Add ${p.name} to order`}
                    >
                      {inOrder ? `Add · ${inOrder} in order` : "Add to order"}
                    </Button>
                  }
                />
              )
            })}
          </div>

          <div className="min-w-0 space-y-4 md:space-y-5 xl:sticky xl:top-24 xl:self-start">
            <Panel>
              <h2 className="mb-4 text-[0.9375rem] font-medium">Your order</h2>
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
                <span className="text-[0.8125rem] font-medium">Total payable</span>
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
              <Button size="lg" className="mt-4 w-full" disabled={units === 0} onClick={checkout}>
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
