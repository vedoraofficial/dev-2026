import { useQuery } from "@tanstack/react-query"

import {
  getPaymentStatus,
  isPaymentFailed,
  isPaymentPending,
  isPaymentSuccess,
  startPhonePeCheckout,
  startPhonePeTopup,
} from "@/features/payments/api"
import { useApiMutation } from "@/lib/mutation"

/** Payments change orders and wallets — refresh both. */
const AFFECTED = [["orders"], ["wallet"]]

/** Pay an existing order with PhonePe (redirects the browser on success). */
export const usePayOrder = () =>
  useApiMutation(startPhonePeCheckout, {
    error: "Couldn't start the PhonePe payment. Try again.",
  })

/** Top up wallet balance with PhonePe (redirects the browser on success). */
export const useTopupWallet = () =>
  useApiMutation(startPhonePeTopup, {
    error: "Couldn't start the wallet top-up payment. Try again.",
  })

/** Poll the payment status after PhonePe sends the user back. */
export const usePaymentStatus = (merchantOrderId: string | null) =>
  useQuery({
    queryKey: ["payments", "status", merchantOrderId],
    queryFn: () => getPaymentStatus(merchantOrderId ?? ""),
    enabled: !!merchantOrderId,
    // Keep polling every 3.5s while PhonePe still says PENDING.
    refetchInterval: (query) => (isPaymentPending(query.state.data) ? 3500 : false),
  })

/** Ask PhonePe once more about a payment that is still pending (e.g. from My Orders). */
export const useCheckPayment = () =>
  useApiMutation(getPaymentStatus, {
    success: (r) =>
      isPaymentSuccess(r)
        ? "Payment verified and completed"
        : isPaymentFailed(r)
          ? "Payment failed — you can try again"
          : "PhonePe still shows this payment as pending",
    invalidate: AFFECTED,
  })
