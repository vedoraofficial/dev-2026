import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { PriceTag } from "@/components/common/price-tag"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { useCreateOrder, useMyOrders } from "@/features/orders/queries"
import { usePayOrder } from "@/features/payments/queries"
import { toCatalogProduct, unitsByProduct } from "@/features/products/catalog"
import { ProductCard } from "@/features/products/components/product-card"
import { useProducts } from "@/features/products/queries"
import { formatBV, formatINR, formatNumber } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

/** The backend's plan: sponsor gets ₹200 flat + 10% of BV; levels 2–5 get 10 / 10 / 5 / 5%. */
const sponsorShare = (units: number, bv: number) => units * 200 + bv * 0.1
const uplineShare = (bv: number) => bv * 0.3

/** product id → quantity */
type Cart = Record<number, number>

/**
 * Same catalogue as Admin › Products (without the stat cards) — "sold" is this partner's own paid
 * orders — plus the order panel. Checkout creates one order per product (the backend takes one
 * product per order) and opens PhonePe for the first; the rest can be paid from My Orders.
 */
export function PartnerProductsPage() {
  const productsQuery = useProducts()
  const myOrders = useMyOrders()
  const createOrder = useCreateOrder()
  const payOrder = usePayOrder()
  const [cart, setCart] = useState<Cart>({})
  const [busy, setBusy] = useState(false)

  const sold = unitsByProduct(myOrders.data ?? [])
  const live = (productsQuery.data ?? []).filter((p) => p.status === "ACTIVE")

  const lines = live
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, qty: cart[p.id] ?? 0 }))
  const units = lines.reduce((sum, l) => sum + l.qty, 0)
  const bv = lines.reduce((sum, l) => sum + l.qty * l.product.bvAmount, 0)
  const total = lines.reduce((sum, l) => sum + l.qty * paiseToRupees(l.product.salePrice), 0)

  const add = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
  const remove = (id: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }))

  const checkout = async () => {
    setBusy(true)
    try {
      const created: number[] = []
      for (const l of lines) {
        const r = await createOrder.mutateAsync({
          productId: l.product.id,
          quantity: l.qty,
          paymentMethod: "PHONEPE",
        })
        created.push(Number(r.order.id))
      }
      setCart({})
      if (created.length > 1) {
        toast.success(`${created.length} orders created`, {
          description: "Paying the first now — pay the others from My Orders.",
        })
      }
      payOrder.mutate(created[0])
    } catch {
      // The failed call already showed its error; orders created so far are in My Orders.
    } finally {
      setBusy(false)
    }
  }

  const working = busy || payOrder.isPending

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="GST as per Indian law · 7-day manufacturing defect warranty"
        actions={
          <Button asChild variant="outline">
            <Link to={ROUTES.partner.orders}>Order history</Link>
          </Button>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4 md:space-y-5">
            <QueryState
              query={productsQuery}
              rows={3}
              empty={live.length === 0}
              emptyMessage="No products are on sale yet."
            >
              {live.map((p) => {
                const inOrder = cart[p.id] ?? 0
                return (
                  <ProductCard
                    key={p.id}
                    product={toCatalogProduct(p)}
                    soldLabel={`${sold.get(p.id) ?? 0} bought by you`}
                    action={
                      <Button
                        size="sm"
                        onClick={() => add(p.id)}
                        aria-label={`Add ${p.name} to order`}
                      >
                        {inOrder ? `Add · ${inOrder} in order` : "Add to order"}
                      </Button>
                    }
                  />
                )
              })}
            </QueryState>
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
                    <li key={product.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-foreground/85">
                        {product.name} × {qty}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <PriceTag
                          className="font-mono"
                          price={paiseToRupees(product.salePrice) * qty}
                          mrp={paiseToRupees(product.mrp) * qty}
                        />
                        <button
                          type="button"
                          onClick={() => remove(product.id)}
                          aria-label={`Remove one ${product.name}`}
                          className="grid size-6 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                        >
                          −
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <dl className="space-y-2.5 py-4 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">BV generated</dt>
                  <dd className="font-mono text-gold">{formatBV(bv)}</dd>
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

              <Button
                size="lg"
                className="mt-4 w-full"
                disabled={units === 0 || working}
                onClick={() => void checkout()}
              >
                {working ? "Opening PhonePe…" : "Checkout with PhonePe"}
              </Button>
              <p className="mt-3 text-center text-[0.625rem] text-muted-foreground">
                Prepaid only · UPI, cards, net banking on PhonePe. No COD.
                {lines.length > 1 ? (
                  <>
                    <br />
                    One order per product — {lines.length} orders will be created.
                  </>
                ) : null}
              </p>
            </Panel>

            <Panel>
              <p className="mb-3 eyebrow text-gold">Commission on this order</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Paid when the order is confirmed: your sponsor gets ₹200 per unit plus 10% of the
                BV, and Levels 2–5 above get 10%, 10%, 5% and 5% of the BV.
              </p>
              <dl className="mt-4 space-y-2.5 border-t border-border/70 pt-4 text-[0.8125rem]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sponsor on {formatNumber(units)} units</dt>
                  <dd className="font-mono text-success">{formatINR(sponsorShare(units, bv))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Upline distribution</dt>
                  <dd className="font-mono text-gold-light">{formatINR(uplineShare(bv))}</dd>
                </div>
              </dl>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
