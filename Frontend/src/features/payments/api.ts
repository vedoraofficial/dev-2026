import { api } from "@/lib/api"

export type InitiatePaymentResponse = {
  message: string
  redirectUrl: string
  merchantOrderId: string
  orderId: number
}

export type InitiateTopupResponse = {
  message: string
  redirectUrl: string
  merchantOrderId: string
  amount: number
}

/** GET /api/payment/status/:merchantOrderId */
export type PaymentStatusResponse = {
  message: string
  orderId?: number
  topupId?: number
  paymentStatus?: "PAID" | "FAILED" | "PENDING"
  status?: "COMPLETED" | "FAILED" | "PENDING"
  orderStatus?: string
  phonepeState?: string
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

/** POST /api/payment/initiate/:orderId — returns PhonePe's checkout page URL for an order. */
export async function initiatePayment(orderId: number): Promise<InitiatePaymentResponse> {
  const { data } = await api.post<InitiatePaymentResponse>(`/payment/initiate/${orderId}`)
  return data
}

/** POST /api/payment/topup — returns PhonePe's checkout page URL for wallet top-up. */
export async function initiateTopup(amountInPaise: number): Promise<InitiateTopupResponse> {
  const { data } = await api.post<InitiateTopupResponse>("/payment/topup", {
    amount: amountInPaise,
  })
  return data
}

/** GET /api/payment/status/:merchantOrderId — asks PhonePe and confirms / fails the payment. */
export async function getPaymentStatus(merchantOrderId: string): Promise<PaymentStatusResponse> {
  const { data } = await api.get<PaymentStatusResponse>(
    `/payment/status/${encodeURIComponent(merchantOrderId)}`,
  )
  return data
}

/*
 * GET /api/payment/callback and POST /api/payment/webhook are called by PhonePe itself
 * (server-to-server / redirect), never by this app.
 */

const PENDING_PAYMENT_KEY = "vedora.pendingPayment"

export type PendingPayment = {
  merchantOrderId: string
  type: "ORDER" | "TOPUP"
  orderId?: number
  amount?: number
}

/**
 * Start PhonePe checkout for an order: remember which payment we are waiting for,
 * then send the browser to PhonePe.
 */
export async function startPhonePeCheckout(orderId: number): Promise<void> {
  const { redirectUrl, merchantOrderId } = await initiatePayment(orderId)
  try {
    sessionStorage.setItem(
      PENDING_PAYMENT_KEY,
      JSON.stringify({ merchantOrderId, type: "ORDER", orderId } satisfies PendingPayment),
    )
  } catch {
    // Storage blocked — the status page will ask the user to check My Orders.
  }
  window.location.assign(redirectUrl)
}

/**
 * Start PhonePe checkout for wallet top-up: remember topup details,
 * then send the browser to PhonePe.
 */
export async function startPhonePeTopup(amountInPaise: number): Promise<void> {
  const { redirectUrl, merchantOrderId, amount } = await initiateTopup(amountInPaise)
  try {
    sessionStorage.setItem(
      PENDING_PAYMENT_KEY,
      JSON.stringify({ merchantOrderId, type: "TOPUP", amount } satisfies PendingPayment),
    )
  } catch {
    // Storage blocked
  }
  window.location.assign(redirectUrl)
}

/** The payment started by `startPhonePeCheckout` or `startPhonePeTopup`, read on the /payment/status page. */
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
