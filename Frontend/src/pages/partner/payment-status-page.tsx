import { CircleCheck, CircleX, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { orderNo } from "@/features/orders/labels"
import { clearPendingPayment, readPendingPayment } from "@/features/payments/api"
import { usePayOrder, usePaymentStatus } from "@/features/payments/queries"
import { apiErrorMessage } from "@/lib/api"

/** Where PhonePe returns the buyer. Polls the backend until the payment is PAID or FAILED. */
export function PaymentStatusPage() {
  // PhonePe's redirect carries no ID — we saved it just before leaving for PhonePe.
  const [pending] = useState(readPendingPayment)
  const status = usePaymentStatus(pending?.merchantOrderId ?? null)
  const payOrder = usePayOrder()
  const result = status.data?.paymentStatus

  // Done with this payment once PhonePe gives a final answer.
  useEffect(() => {
    if (result === "PAID" || result === "FAILED") clearPendingPayment()
  }, [result])

  const ordersLink = (
    <Button asChild variant="outline">
      <Link to={ROUTES.partner.orders}>Go to My Orders</Link>
    </Button>
  )

  let body
  if (!pending) {
    body = (
      <>
        <h2 className="font-display text-2xl">No payment in progress</h2>
        <p className="text-sm text-muted-foreground">
          Check the order&apos;s status in My Orders — you can pay or check the payment from there.
        </p>
        {ordersLink}
      </>
    )
  } else if (status.isError) {
    body = (
      <>
        <CircleX className="size-12 text-danger" aria-hidden />
        <h2 className="font-display text-2xl">Couldn&apos;t check the payment</h2>
        <p className="text-sm text-muted-foreground">{apiErrorMessage(status.error)}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => void status.refetch()}>Try again</Button>
          {ordersLink}
        </div>
      </>
    )
  } else if (result === "PAID") {
    body = (
      <>
        <CircleCheck className="size-12 text-success" aria-hidden />
        <h2 className="font-display text-2xl">Payment successful</h2>
        <p className="text-sm text-muted-foreground">
          Order <MonoId tone="gold">{orderNo(pending.orderId)}</MonoId> is confirmed and the
          commissions have gone out to your uplines.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to={ROUTES.partner.orders}>View my orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTES.partner.products}>Keep shopping</Link>
          </Button>
        </div>
      </>
    )
  } else if (result === "FAILED") {
    body = (
      <>
        <CircleX className="size-12 text-danger" aria-hidden />
        <h2 className="font-display text-2xl">Payment failed</h2>
        <p className="text-sm text-muted-foreground">
          Nothing was charged for <MonoId tone="gold">{orderNo(pending.orderId)}</MonoId>. You can
          try again.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button disabled={payOrder.isPending} onClick={() => payOrder.mutate(pending.orderId)}>
            {payOrder.isPending ? "Opening PhonePe…" : "Retry payment"}
          </Button>
          {ordersLink}
        </div>
      </>
    )
  } else {
    body = (
      <>
        <Loader2 className="size-12 animate-spin text-gold" aria-hidden />
        <h2 className="font-display text-2xl">Confirming your payment…</h2>
        <p className="text-sm text-muted-foreground">
          Waiting for PhonePe for <MonoId tone="gold">{orderNo(pending.orderId)}</MonoId>. This page
          updates by itself.
        </p>
        {ordersLink}
      </>
    )
  }

  return (
    <>
      <PageHeader title="Payment" subtitle="PhonePe checkout result" />
      <PageBody>
        <Panel
          className="mx-auto flex max-w-lg flex-col items-center gap-4 py-10 text-center"
          aria-live="polite"
        >
          {body}
        </Panel>
      </PageBody>
    </>
  )
}
