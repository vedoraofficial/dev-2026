import { useQuery } from "@tanstack/react-query"

import { getPaymentStatus, startPhonePeCheckout } from "@/features/payments/api"
import { useApiMutation } from "@/lib/mutation"

/** Payments change orders and wallets — refresh both. */
const AFFECTED = [["orders"], ["wallet"]]

/** Pay an existing order with PhonePe (redirects the browser on success). */
export const usePayOrder = () =>
  useApiMutation(startPhonePeCheckout, {
    error: "Couldn't start the PhonePe payment. Try again.",
  })

/** Poll the payment status after PhonePe sends the user back. */
export const usePaymentStatus = (merchantOrderId: string | null) =>
  useQuery({
    queryKey: ["payments", "status", merchantOrderId],
    queryFn: () => getPaymentStatus(merchantOrderId ?? ""),
    enabled: !!merchantOrderId,
    // Keep asking every 4 s while PhonePe still says PENDING.
    refetchInterval: (query) => (query.state.data?.paymentStatus === "PENDING" ? 4000 : false),
  })

/** Ask PhonePe once more about a payment that is still pending (e.g. from My Orders). */
export const useCheckPayment = () =>
  useApiMutation(getPaymentStatus, {
    success: (r) =>
      r.paymentStatus === "PAID"
        ? "Payment received — order confirmed"
        : r.paymentStatus === "FAILED"
          ? "Payment failed — you can pay again"
          : "PhonePe still shows this payment as pending",
    invalidate: AFFECTED,
  })
