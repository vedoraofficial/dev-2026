import { api } from "@/lib/api"

export type InitiatePaymentResponse = {
  message: string
  keyId: string
  amount: number
  currency: string
  orderId: string
  merchantOrderId: string
  redirectUrl: string
  name?: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, any>
  theme?: {
    color?: string
  }
  receipt?: string
}

export type InitiateTopupResponse = InitiatePaymentResponse

export type VerifyPaymentPayload = {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export type VerifyPaymentResponse = {
  message: string
  orderId?: number
  topupId?: number
  paymentStatus?: "PAID" | "FAILED" | "PENDING"
  status?: "COMPLETED" | "FAILED" | "PENDING"
  orderStatus?: string
  amount?: number
}

export type PaymentStatusResponse = {
  message: string
  orderId?: number
  topupId?: number
  paymentStatus?: "PAID" | "FAILED" | "PENDING" | "REFUNDED"
  /** REFUNDED: a partner registration was paid but could not be completed (money back in wallet) */
  status?: "COMPLETED" | "FAILED" | "PENDING" | "REFUNDED"
  orderStatus?: string
  amount?: number
  /** Add Partner payments (JOIN_…) */
  kind?: "REGISTRATION"
  partnerName?: string
  partner?: { id: number; vedId: string; name: string; status: string; slotNumber?: number }
  failureReason?: string
  /** Referral join page payments: whose team the new partner joined */
  sponsor?: { vedId: string; name: string }
}

export function isPaymentSuccess(res?: PaymentStatusResponse | null): boolean {
  if (!res) return false
  return res.paymentStatus === "PAID" || res.status === "COMPLETED"
}

export function isPaymentFailed(res?: PaymentStatusResponse | null): boolean {
  if (!res) return false
  return (
    res.paymentStatus === "FAILED" ||
    res.status === "FAILED" ||
    res.paymentStatus === "REFUNDED" ||
    res.status === "REFUNDED"
  )
}

export function isPaymentPending(res?: PaymentStatusResponse | null): boolean {
  if (!res) return false
  return res.paymentStatus === "PENDING" || res.status === "PENDING"
}

/** POST /api/payment/initiate/:orderId — creates Razorpay order for an order. */
export async function initiatePayment(orderId: number): Promise<InitiatePaymentResponse> {
  const { data } = await api.post<InitiatePaymentResponse>(`/payment/initiate/${orderId}`)
  return data
}

/** POST /api/payment/topup — creates Razorpay order for wallet top-up. */
export async function initiateTopup(amountInPaise: number): Promise<InitiateTopupResponse> {
  const { data } = await api.post<InitiateTopupResponse>("/payment/topup", {
    amount: amountInPaise,
  })
  return data
}

/** POST /api/payment/verify — verifies Razorpay payment signature */
export async function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
  const { data } = await api.post<VerifyPaymentResponse>("/payment/verify", payload)
  return data
}

/** GET /api/payment/status/:merchantOrderId — checks payment status */
export async function getPaymentStatus(merchantOrderId: string): Promise<PaymentStatusResponse> {
  const { data } = await api.get<PaymentStatusResponse>(
    `/payment/status/${encodeURIComponent(merchantOrderId)}`,
  )
  return data
}

/** POST /api/payment/reconcile — [Admin] re-check payments still pending after `olderThanMinutes`. */
export type ReconcileResult = {
  processedOrders: number
  processedTopups: number
  pendingOrdersFound: number
  pendingTopupsFound: number
  /** Add Partner payments (partner registrations held until paid) */
  processedRegistrations?: number
  pendingRegistrationsFound?: number
  errors: string[]
}

export async function reconcilePayments(olderThanMinutes = 10): Promise<ReconcileResult> {
  const { data } = await api.post<ReconcileResult>("/payment/reconcile", undefined, {
    params: { olderThanMinutes },
  })
  return data
}

/* POST /api/payment/webhook is called by Razorpay itself (server-to-server), never by this app. */

const PENDING_PAYMENT_KEY = "vedora.pendingPayment"

export type PendingPayment = {
  merchantOrderId: string
  /** JOIN = Add Partner: the partner is registered once this payment succeeds */
  type: "ORDER" | "TOPUP" | "JOIN"
  orderId?: number
  amount?: number
  partnerName?: string
}

export function savePendingPayment(pending: PendingPayment) {
  try {
    sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pending))
  } catch {
    // ignore
  }
}

export function readPendingPayment(): PendingPayment | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      merchantOrderId: parsed.merchantOrderId,
      type: parsed.type || (parsed.orderId ? "ORDER" : "TOPUP"),
      orderId: parsed.orderId,
      amount: parsed.amount,
      partnerName: parsed.partnerName,
    }
  } catch {
    return null
  }
}

export function clearPendingPayment() {
  try {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY)
  } catch {
    // nothing to clear
  }
}

declare global {
  interface Window {
    Razorpay?: any
  }
}

export interface RazorpayModalOptions {
  initiateData: InitiatePaymentResponse
  onSuccess: (verifyResponse: VerifyPaymentResponse) => void
  onError?: (error: any) => void
  onDismiss?: () => void
  /** Checks the payment after the popup — POST /api/payment/verify unless given (join page) */
  verify?: (payload: VerifyPaymentPayload) => Promise<VerifyPaymentResponse>
}

/**
 * Open Razorpay Standard Checkout Modal
 */
export function openRazorpayCheckout({
  initiateData,
  onSuccess,
  onError,
  onDismiss,
  verify = verifyPayment,
}: RazorpayModalOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.Razorpay) {
      const err = new Error("Razorpay SDK is not loaded. Please refresh the page.")
      onError?.(err)
      reject(err)
      return
    }

    const options = {
      key: initiateData.keyId,
      amount: initiateData.amount,
      currency: initiateData.currency || "INR",
      name: initiateData.name || "VEDORA",
      description: initiateData.description || "Order Payment",
      order_id: initiateData.orderId,
      prefill: initiateData.prefill || {},
      notes: initiateData.notes || {},
      theme: initiateData.theme || { color: "#D4AF37" },
      modal: {
        ondismiss: () => {
          onDismiss?.()
          resolve()
        },
      },
      handler: async (response: {
        razorpay_payment_id: string
        razorpay_order_id: string
        razorpay_signature: string
      }) => {
        try {
          const verifyResult = await verify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          onSuccess(verifyResult)
          resolve()
        } catch (verifyErr) {
          onError?.(verifyErr)
          reject(verifyErr)
        }
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on("payment.failed", (response: any) => {
      onError?.(response.error || response)
    })
    rzp.open()
  })
}

/**
 * Start Razorpay checkout for an order
 */
export async function startRazorpayOrderCheckout(
  orderId: number,
  callbacks?: {
    onSuccess?: (verifyRes: VerifyPaymentResponse) => void
    onError?: (error: any) => void
    onDismiss?: () => void
  },
): Promise<void> {
  const initiateData = await initiatePayment(orderId)
  // For orders the backend sends our order number as `orderId` and Razorpay's own order id
  // (order_…) as `merchantOrderId` — Razorpay needs its own id, or it answers 400.
  const razorpayOrderId = initiateData.merchantOrderId || initiateData.orderId
  savePendingPayment({
    merchantOrderId: razorpayOrderId,
    type: "ORDER",
    orderId,
  })

  return openRazorpayCheckout({
    initiateData: { ...initiateData, orderId: razorpayOrderId },
    onSuccess: (res) => {
      callbacks?.onSuccess?.(res)
    },
    onError: (err) => {
      callbacks?.onError?.(err)
    },
    onDismiss: () => {
      callbacks?.onDismiss?.()
    },
  })
}

/**
 * Start Razorpay checkout for wallet top-up
 */
export async function startRazorpayTopup(
  amountInPaise: number,
  callbacks?: {
    onSuccess?: (verifyRes: VerifyPaymentResponse) => void
    onError?: (error: any) => void
    onDismiss?: () => void
  },
): Promise<void> {
  const initiateData = await initiateTopup(amountInPaise)
  savePendingPayment({
    merchantOrderId: initiateData.orderId,
    type: "TOPUP",
    amount: amountInPaise,
  })

  return openRazorpayCheckout({
    initiateData,
    onSuccess: (res) => {
      callbacks?.onSuccess?.(res)
    },
    onError: (err) => {
      callbacks?.onError?.(err)
    },
    onDismiss: () => {
      callbacks?.onDismiss?.()
    },
  })
}

/**
 * Add Partner (paid joining order): the backend already created the Razorpay order and returned
 * its checkout details — remember the payment, then open the Razorpay popup.
 */
export function startRazorpayJoinCheckout(
  checkout: InitiatePaymentResponse,
  pending: Omit<PendingPayment, "merchantOrderId" | "type">,
  callbacks?: {
    onSuccess?: (verifyRes: VerifyPaymentResponse) => void
    onError?: (error: any) => void
    onDismiss?: () => void
  },
): Promise<void> {
  savePendingPayment({ ...pending, merchantOrderId: checkout.orderId, type: "JOIN" })
  return openRazorpayCheckout({
    initiateData: checkout,
    onSuccess: (res) => callbacks?.onSuccess?.(res),
    onError: (err) => callbacks?.onError?.(err),
    onDismiss: () => callbacks?.onDismiss?.(),
  })
}
