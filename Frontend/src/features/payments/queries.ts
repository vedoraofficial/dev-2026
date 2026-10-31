import { useQuery } from "@tanstack/react-query"

import {
  getPaymentStatus,
  isPaymentFailed,
  isPaymentPending,
  isPaymentSuccess,
  reconcilePayments,
  startRazorpayOrderCheckout,
  startRazorpayTopup,
} from "@/features/payments/api"
import { useApiMutation } from "@/lib/mutation"

/** Payments change orders and wallets — refresh both. */
const AFFECTED = [["orders"], ["wallet"], ["account"]]

/** Pay an existing order with Razorpay checkout modal. */
export const usePayOrder = () =>
  useApiMutation(startRazorpayOrderCheckout, {
    success: "Payment completed successfully! Order is confirmed.",
    error: "Couldn't start the Razorpay payment. Try again.",
    invalidate: AFFECTED,
  })

/** Top up wallet balance with Razorpay checkout modal. */
export const useTopupWallet = () =>
  useApiMutation(startRazorpayTopup, {
    success: "Wallet top-up successful! Balance updated.",
    error: "Couldn't start the wallet top-up payment. Try again.",
    invalidate: AFFECTED,
  })

/** Poll the payment status after payment attempt. */
export const usePaymentStatus = (merchantOrderId: string | null) =>
  useQuery({
    queryKey: ["payments", "status", merchantOrderId],
    queryFn: () => getPaymentStatus(merchantOrderId ?? ""),
    enabled: !!merchantOrderId,
    // Keep polling every 3.5s while Razorpay still says PENDING.
    refetchInterval: (query) => (isPaymentPending(query.state.data) ? 3500 : false),
  })

/** Ask backend once more about a payment status (e.g. from My Orders). */
export const useCheckPayment = () =>
  useApiMutation(getPaymentStatus, {
    success: (r) =>
      isPaymentSuccess(r)
        ? "Payment verified and completed"
        : isPaymentFailed(r)
          ? "Payment failed — you can try again"
          : "Payment still pending verification",
    invalidate: AFFECTED,
  })

/** [Admin] Ask Razorpay about every order / top-up / Add Partner payment still pending after 10 minutes. */
export const useReconcilePayments = () =>
  useApiMutation(() => reconcilePayments(), {
    success: (r) => {
      const found = r.pendingOrdersFound + r.pendingTopupsFound + (r.pendingRegistrationsFound ?? 0)
      if (found === 0) return "No stuck payments — everything is settled"
      const settled = `${r.processedOrders} of ${r.pendingOrdersFound} orders and ${r.processedTopups} of ${r.pendingTopupsFound} top-ups re-checked`
      return r.errors.length ? `${settled} · ${r.errors.length} could not be checked` : settled
    },
    invalidate: AFFECTED,
  })
