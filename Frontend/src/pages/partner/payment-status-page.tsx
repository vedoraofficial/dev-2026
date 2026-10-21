import { CircleCheck, CircleX, Loader2, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { orderNo } from "@/features/orders/labels"
import {
  clearPendingPayment,
  isPaymentFailed,
  isPaymentSuccess,
  readPendingPayment,
} from "@/features/payments/api"
import { usePayOrder, usePaymentStatus } from "@/features/payments/queries"
import { apiErrorMessage } from "@/lib/api"
import { formatINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

/** Where payment status is checked. Polls the backend until the payment is PAID/COMPLETED or FAILED. */
export function PaymentStatusPage() {
  const [searchParams] = useSearchParams()
  const merchantOrderIdFromUrl =
    searchParams.get("merchantOrderId") || searchParams.get("orderId") || null

  // Read saved pending payment from sessionStorage
  const [pending] = useState(readPendingPayment)
  const activeMerchantOrderId = merchantOrderIdFromUrl || pending?.merchantOrderId || null

  const status = usePaymentStatus(activeMerchantOrderId)
  const payOrder = usePayOrder()

  const isSuccess = isPaymentSuccess(status.data)
  const isFailed = isPaymentFailed(status.data)

  const isTopup =
    activeMerchantOrderId?.startsWith("TOPUP_") || pending?.type === "TOPUP"

  // Clear pending payment key once a definitive answer is received
  useEffect(() => {
    if (isSuccess || isFailed) {
      clearPendingPayment()
    }
  }, [isSuccess, isFailed])

  const ordersLink = (
    <Button asChild variant="outline">
      <Link to={ROUTES.partner.orders}>Go to My Orders</Link>
    </Button>
  )

  const walletLink = (
    <Button asChild variant="outline">
      <Link to={ROUTES.partner.wallet}>Go to Wallet</Link>
    </Button>
  )

  let body
  if (!activeMerchantOrderId) {
    body = (
      <>
        <h2 className="font-display text-2xl">No payment in progress</h2>
        <p className="text-sm text-muted-foreground">
          Check the order&apos;s status in My Orders or view your Wallet balance.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {ordersLink}
          {walletLink}
        </div>
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
          {isTopup ? walletLink : ordersLink}
        </div>
      </>
    )
  } else if (isSuccess) {
    if (isTopup) {
      const topupRupees = paiseToRupees(status.data?.amount ?? pending?.amount)
      body = (
        <>
          <div className="relative">
            <CircleCheck className="size-14 text-success" aria-hidden />
            <Wallet className="absolute -bottom-1 -right-1 size-6 rounded-full bg-field p-0.5 text-gold" />
          </div>
          <h2 className="font-display text-2xl">Wallet Top-up Successful</h2>
          <p className="text-sm text-muted-foreground">
            {topupRupees > 0 ? (
              <>
                <span className="font-mono font-medium text-foreground">{formatINR(topupRupees)}</span> has been credited to your available wallet balance.
              </>
            ) : (
              "Your wallet balance has been updated successfully via Razorpay."
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to={ROUTES.partner.wallet}>View my wallet</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={ROUTES.partner.products}>Shop products</Link>
            </Button>
          </div>
        </>
      )
    } else {
      const resolvedOrderId = status.data?.orderId || pending?.orderId
      body = (
        <>
          <CircleCheck className="size-14 text-success" aria-hidden />
          <h2 className="font-display text-2xl">Payment successful</h2>
          <p className="text-sm text-muted-foreground">
            {resolvedOrderId ? (
              <>
                Order <MonoId tone="gold">{orderNo(resolvedOrderId)}</MonoId> is confirmed and commissions have been distributed.
              </>
            ) : (
              "Your order payment has been confirmed successfully."
            )}
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
    }
  } else if (isFailed) {
    if (isTopup) {
      body = (
        <>
          <CircleX className="size-14 text-danger" aria-hidden />
          <h2 className="font-display text-2xl">Top-up failed</h2>
          <p className="text-sm text-muted-foreground">
            The transaction was declined or cancelled. Nothing was deducted from your bank account.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to={ROUTES.partner.wallet}>Try again</Link>
            </Button>
            {walletLink}
          </div>
        </>
      )
    } else {
      const resolvedOrderId = status.data?.orderId || pending?.orderId
      body = (
        <>
          <CircleX className="size-14 text-danger" aria-hidden />
          <h2 className="font-display text-2xl">Payment failed</h2>
          <p className="text-sm text-muted-foreground">
            {resolvedOrderId ? (
              <>
                Nothing was charged for <MonoId tone="gold">{orderNo(resolvedOrderId)}</MonoId>. You can try again.
              </>
            ) : (
              "Payment could not be completed. You can try again from My Orders."
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {resolvedOrderId ? (
              <Button disabled={payOrder.isPending} onClick={() => payOrder.mutate(resolvedOrderId)}>
                {payOrder.isPending ? "Opening Razorpay…" : "Retry payment"}
              </Button>
            ) : null}
            {ordersLink}
          </div>
        </>
      )
    }
  } else {
    // Pending / Loading
    const resolvedOrderId = status.data?.orderId || pending?.orderId
    body = (
      <>
        <Loader2 className="size-12 animate-spin text-gold" aria-hidden />
        <h2 className="font-display text-2xl">Confirming your payment…</h2>
        <p className="text-sm text-muted-foreground">
          {isTopup ? (
            "Waiting for Razorpay confirmation for your wallet top-up. This page updates automatically."
          ) : resolvedOrderId ? (
            <>
              Waiting for Razorpay for <MonoId tone="gold">{orderNo(resolvedOrderId)}</MonoId>. This page updates automatically.
            </>
          ) : (
            "Waiting for Razorpay transaction confirmation. This page updates automatically."
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {isTopup ? walletLink : ordersLink}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Payment" subtitle="Razorpay checkout status" />
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
