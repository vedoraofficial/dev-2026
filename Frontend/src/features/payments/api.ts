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
  paymentStatus?: "PAID" | "FAILED" | "PENDING"
  status?: "COMPLETED" | "FAILED" | "PENDING"
  orderStatus?: string
  amount?: number
}

export function isPaymentSuccess(res?: PaymentStatusResponse | null): boolean {
  if (!res) return false
  return res.paymentStatus === "PAID" || res.status === "COMPLETED"
}

export function isPaymentFailed(res?: PaymentStatusResponse | null): boolean {
  if (!res) return false
  return res.paymentStatus === "FAILED" || res.status === "FAILED"
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

const PENDING_PAYMENT_KEY = "vedora.pendingPayment"

export type PendingPayment = {
  merchantOrderId: string
  type: "ORDER" | "TOPUP"
  orderId?: number
  amount?: number
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
}

/**
 * Open Razorpay Standard Checkout Modal
 */
export function openRazorpayCheckout({
  initiateData,
  onSuccess,
  onError,
  onDismiss,
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
          const verifyResult = await verifyPayment({
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
  savePendingPayment({
    merchantOrderId: initiateData.orderId,
    type: "ORDER",
    orderId,
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
