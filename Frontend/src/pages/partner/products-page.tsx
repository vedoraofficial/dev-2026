import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { PriceTag } from "@/components/common/price-tag"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { checkoutCart } from "@/features/orders/api"
import { useMyOrders } from "@/features/orders/queries"
import { startRazorpayCartCheckout } from "@/features/payments/api"
import { toCatalogProduct, unitsByProduct } from "@/features/products/catalog"
import { ProductCard } from "@/features/products/components/product-card"
import { useProducts } from "@/features/products/queries"
import { useWalletSummary } from "@/features/wallet/queries"
import { formatBV, formatINR, formatNumber } from "@/lib/format"
import { apiErrorMessage } from "@/lib/api"
import { paiseToRupees } from "@/lib/money"

/** The backend's plan: sponsor gets ₹200 flat + 10% of BV; levels 2–5 get 10 / 10 / 5 / 5%. */
const sponsorShare = (units: number, bv: number) => units * 200 + bv * 0.1
const uplineShare = (bv: number) => bv * 0.3

/** product id → quantity */
type Cart = Record<number, number>

/**
 * Same catalogue as Admin › Products (without the stat cards) — "sold" is this partner's own paid
 * orders — plus the order panel. Checkout supports both Razorpay online gateway and Wallet Balance.
 */
export function PartnerProductsPage() {
  const queryClient = useQueryClient()
  const productsQuery = useProducts()
  const myOrders = useMyOrders()
  const walletSummary = useWalletSummary()
  const [cart, setCart] = useState<Cart>({})
  const [busy, setBusy] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "WALLET">("RAZORPAY")

  const sold = unitsByProduct(myOrders.data ?? [])
  const live = (productsQuery.data ?? []).filter((p) => p.status === "ACTIVE")

  const lines = live
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, qty: cart[p.id] ?? 0 }))
  const units = lines.reduce((sum, l) => sum + l.qty, 0)
  const bv = lines.reduce((sum, l) => sum + l.qty * l.product.bvAmount, 0)
  const total = lines.reduce((sum, l) => sum + l.qty * paiseToRupees(l.product.salePrice), 0)

  const availableBalance = paiseToRupees(walletSummary.data?.availableBalance)
  const canUseWallet = availableBalance >= total && total > 0

  // Can't put more in the order than is in stock.
  const stockOf = (id: number) => live.find((p) => p.id === id)?.stockAvailable ?? null
  const add = (id: number) =>
    setCart((c) => {
      const next = (c[id] ?? 0) + 1
      const stock = stockOf(id)
      return stock != null && next > stock ? c : { ...c, [id]: next }
    })
  const remove = (id: number) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }))

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["wallet"] })
    void queryClient.invalidateQueries({ queryKey: ["orders"] })
  }

  // The whole cart is one checkout: one payment (wallet or Razorpay), one invoice, one email.
  const checkout = async () => {
    setBusy(true)
    try {
      const result = await checkoutCart({
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
        paymentMethod,
      })
      setCart({})
      refresh()

      if (result.status === "PAID") {
        toast.success(
          `${result.orders.length > 1 ? `${result.orders.length} orders` : "Order"} confirmed!`,
          {
            description:
              "Paid from your wallet balance. Your invoice is emailed to you and in My Orders.",
          },
        )
        return
      }

      await startRazorpayCartCheckout(result.checkout, result.orderIds[0], {
        onSuccess: () => {
          toast.success("Payment received — your orders are confirmed.", {
            description: "Your invoice is emailed to you and in My Orders.",
          })
          refresh()
        },
        onDismiss: () =>
          toast.info("Payment cancelled — your orders are waiting in My Orders.", {
            description: "Pay them from My Orders whenever you're ready.",
          }),
        onError: () =>
          toast.error("The payment didn't go through. Check My Orders before trying again."),
      }).catch(() => {
        // onError above already told the user
      })
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't place the order. Try again."))
    } finally {
      setBusy(false)
    }
  }

  const working = busy

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
                const stock = p.stockAvailable ?? null
                const outOfStock = stock != null && stock <= 0
                const atLimit = stock != null && inOrder >= stock
                return (
                  <ProductCard
                    key={p.id}
                    product={toCatalogProduct(p)}
                    soldLabel={`${sold.get(p.id) ?? 0} bought by you`}
                    action={
                      <Button
                        size="sm"
                        variant={outOfStock ? "outline" : "default"}
                        className={
                          outOfStock
                            ? "border-danger/50 font-bold text-danger disabled:opacity-100"
                            : undefined
                        }
                        disabled={outOfStock || atLimit}
                        onClick={() => add(p.id)}
                        aria-label={`Add ${p.name} to order`}
                      >
                        {outOfStock
                          ? "Out of stock"
                          : atLimit
                            ? `All ${stock} in order`
                            : inOrder
                              ? `Add · ${inOrder} in order`
                              : "Add to order"}
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
              {/* Payment Method Selector */}
              {units > 0 && (
                <div className="space-y-2 border-t border-border/70 pt-3">
                  <p className="eyebrow text-[0.625rem]">Payment Method</p>
                  <div className="space-y-2">
                    <label
                      className={`flex cursor-pointer items-start justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                        paymentMethod === "RAZORPAY"
                          ? "border-gold bg-gold/10"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="RAZORPAY"
                          checked={paymentMethod === "RAZORPAY"}
                          onChange={() => setPaymentMethod("RAZORPAY")}
                          className="accent-gold"
                        />
                        <div>
                          <p className="font-medium text-foreground">Razorpay Online</p>
                          <p className="text-[0.6875rem] text-muted-foreground">
                            UPI, Credit/Debit Cards, Net Banking
                          </p>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                        paymentMethod === "WALLET"
                          ? "border-gold bg-gold/10"
                          : "border-border hover:bg-muted"
                      } ${!canUseWallet ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="WALLET"
                          checked={paymentMethod === "WALLET"}
                          disabled={!canUseWallet}
                          onChange={() => setPaymentMethod("WALLET")}
                          className="accent-gold"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-foreground">Wallet Balance</p>
                            <span className="font-mono text-[0.6875rem] text-muted-foreground">
                              ({formatINR(availableBalance)})
                            </span>
                          </div>
                          {!canUseWallet ? (
                            <p className="text-[0.6875rem] text-gold-light">
                              Insufficient balance (need {formatINR(total - availableBalance)} more)
                            </p>
                          ) : (
                            <p className="text-[0.6875rem] text-success">
                              Instant checkout · No gateway redirect
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-baseline justify-between border-t border-border/70 pt-4">
                <span className="text-[0.8125rem] font-medium">Total payable</span>
                <span className="font-display text-3xl">{formatINR(total)}</span>
              </div>

              <Button
                size="lg"
                className="mt-4 w-full"
                disabled={units === 0 || working || (paymentMethod === "WALLET" && !canUseWallet)}
                onClick={() => void checkout()}
              >
                {working
                  ? paymentMethod === "RAZORPAY"
                    ? "Opening Razorpay…"
                    : "Processing order…"
                  : paymentMethod === "RAZORPAY"
                    ? `Checkout with Razorpay (${formatINR(total)})`
                    : `Pay ${formatINR(total)} from Wallet`}
              </Button>
              <p className="mt-3 text-center text-[0.625rem] text-muted-foreground">
                {paymentMethod === "RAZORPAY"
                  ? "Prepaid only · UPI, cards, net banking on Razorpay. No COD."
                  : "Debited instantly from your available wallet balance."}
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
