import type { ReactNode } from "react"

import { MonoId } from "@/components/common/mono-id"
import { QueryState } from "@/components/common/query-state"
import { StatusPill } from "@/components/common/status-pill"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { orderNo, orderStage, paymentMethodLabel, stagePill } from "@/features/orders/labels"
import { useOrder } from "@/features/orders/queries"
import type { OrderDetail } from "@/features/orders/types"
import { formatDateTime } from "@/lib/date"
import { formatBV, formatINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[0.8125rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

type Props = {
  /** The order to show; `null` closes the dialog */
  orderId: number | null
  onClose: () => void
  /** Buttons for the footer, e.g. Pay now (the screen decides what is allowed) */
  actions?: (order: OrderDetail) => ReactNode
}

/** GET /api/order/:id — the order, its payment and the commission split. */
export function OrderDetailDialog({ orderId, onClose, actions }: Props) {
  const order = useOrder(orderId)
  const o = order.data

  return (
    <Dialog open={orderId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{orderId ? orderNo(orderId) : "Order"}</DialogTitle>
          <DialogDescription>
            {o ? (
              <>
                {o.user.name} · <MonoId tone="muted">{o.user.vedId}</MonoId> · User ID {o.user.id} ·{" "}
                {formatDateTime(o.createdAt)}
              </>
            ) : (
              "Loading order…"
            )}
          </DialogDescription>
        </DialogHeader>

        <QueryState query={order} rows={4}>
          {o ? (
            <div className="space-y-4">
              <dl className="space-y-2.5 rounded-xl border border-border bg-field/60 p-3.5">
                <Row label="Product" value={o.product.name} />
                <Row
                  label="Quantity"
                  value={`${o.quantity} × ${formatINR(paiseToRupees(o.unitPrice))}`}
                />
                <Row label="BV" value={<span className="text-gold">{formatBV(o.bvTotal)}</span>} />
                <Row label="Payment" value={paymentMethodLabel[o.paymentMethod]} />
                <Row
                  label="Status"
                  value={
                    <StatusPill variant={stagePill[orderStage(o)].variant}>
                      {stagePill[orderStage(o)].label}
                    </StatusPill>
                  }
                />
                <div className="flex items-baseline justify-between gap-4 border-t border-border/70 pt-2.5">
                  <dt className="font-medium">Total</dt>
                  <dd className="font-display text-2xl">
                    {formatINR(paiseToRupees(o.totalAmount))}
                  </dd>
                </div>
              </dl>

              <div>
                <p className="mb-2 eyebrow">Commission split</p>
                {o.commissions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {o.commissionsDistributed
                      ? "No uplines earned on this order."
                      : "Commissions go out once the payment is confirmed."}
                  </p>
                ) : (
                  <ul className="divide-y divide-border/70 rounded-xl border border-border">
                    {o.commissions.map((c) => (
                      <li
                        key={`${c.level}-${c.beneficiary.vedId}`}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[0.8125rem]"
                      >
                        <span>
                          {c.level === 0 ? "Direct" : `L${c.level}`} · {c.beneficiary.name}{" "}
                          <MonoId tone="muted" className="text-[0.6875rem]">
                            {c.beneficiary.vedId}
                          </MonoId>
                        </span>
                        <span className="font-mono text-success">
                          {formatINR(paiseToRupees(c.amount))}
                          <span className="ml-1 text-[0.6875rem] text-muted-foreground">
                            ({c.commissionRate})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </QueryState>

        {o && actions ? <DialogFooter>{actions(o)}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
