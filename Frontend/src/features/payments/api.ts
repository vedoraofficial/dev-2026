import { api } from "@/lib/api"

export type InitiatePaymentResponse = {
  message: string
  redirectUrl: string
  merchantOrderId: string
  orderId: number
}

/** GET /api/payment/status/:merchantOrderId */
export type PaymentStatusResponse = {
  message: string
  orderId: number
  paymentStatus: "PAID" | "FAILED" | "PENDING"
  orderStatus?: string
  phonepeState?: string
}

/** POST /api/payment/initiate/:orderId — returns PhonePe's checkout page URL. */
export async function initiatePayment(orderId: number): Promise<InitiatePaymentResponse> {
  const { data } = await api.post<InitiatePaymentResponse>(`/payment/initiate/${orderId}`)
  return data
}

/** GET /api/payment/status/:merchantOrderId — asks PhonePe and confirms / fails the order. */
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

/**
 * Start PhonePe checkout for an order: remember which payment we are waiting for (PhonePe's
 * redirect back to /payment/status carries no ID), then send the browser to PhonePe.
 */
export async function startPhonePeCheckout(orderId: number): Promise<void> {
  const { redirectUrl, merchantOrderId } = await initiatePayment(orderId)
  try {
    sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({ merchantOrderId, orderId }))
  } catch {
    // Storage blocked — the status page will ask the user to check My Orders.
  }
  window.location.assign(redirectUrl)
}

/** The payment started by `startPhonePeCheckout`, read on the /payment/status page. */
export function readPendingPayment(): { merchantOrderId: string; orderId: number } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY)
    return raw ? (JSON.parse(raw) as { merchantOrderId: string; orderId: number }) : null
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
