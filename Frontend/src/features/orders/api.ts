import type {
  ApiOrder,
  CancelOrderInput,
  CashOrderInput,
  CheckoutInput,
  CheckoutResult,
  CreatedOrder,
  CreateOrderInput,
  OrderDetail,
} from "@/features/orders/types"
import axios from "axios"

import { api, apiErrorMessage } from "@/lib/api"
import { downloadBlob } from "@/lib/download"

// bigint columns can arrive as strings — normalise the numbers we do maths / formatting on.
const toOrder = (o: ApiOrder): ApiOrder => ({
  ...o,
  id: Number(o.id),
  totalAmount: Number(o.totalAmount),
  bvTotal: Number(o.bvTotal),
})

/** GET /api/order — my orders */
export async function getMyOrders(): Promise<ApiOrder[]> {
  const { data } = await api.get<ApiOrder[]>("/order")
  return data.map(toOrder)
}

/** GET /api/order/:id — with the commission split */
export async function getOrder(id: number): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/order/${id}`)
  return data
}

/** POST /api/order */
export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const { data } = await api.post<CreatedOrder>("/order", input)
  return data
}

/** GET /api/order/admin/all — [Admin] */
export async function getAllOrders(): Promise<ApiOrder[]> {
  const { data } = await api.get<ApiOrder[]>("/order/admin/all")
  return data.map(toOrder)
}

/** POST /api/order/admin/cash — [Admin] */
export async function createCashOrder(input: CashOrderInput): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/order/admin/cash", input)
  return data
}

/**
 * POST /api/order/:id/cancel — an unpaid order is just cancelled. A paid one (Admin only) is
 * refunded to the buyer's wallet, its commissions are reversed and the stock goes back.
 */
export async function cancelOrder({
  id,
  reason,
}: CancelOrderInput): Promise<{ message: string; orderId: number }> {
  const { data } = await api.post<{ message: string; orderId: number }>(`/order/${id}/cancel`, {
    reason,
  })
  return data
}

/** POST /api/order/checkout — the cart: one payment, one invoice, one email. */
export async function checkoutCart(input: CheckoutInput): Promise<CheckoutResult> {
  const { data } = await api.post<CheckoutResult>("/order/checkout", input)
  return data
}

/** GET /api/invoice/order/:id — the GST invoice PDF of a paid order, saved by the browser. */
export async function downloadInvoice(orderId: number): Promise<void> {
  try {
    const res = await api.get<Blob>(`/invoice/order/${orderId}`, { responseType: "blob" })
    const disposition = String(res.headers["content-disposition"] ?? "")
    const name =
      /filename="([^"]+)"/.exec(disposition)?.[1] ?? `VEDORA-invoice-order-${orderId}.pdf`
    downloadBlob(name, res.data)
  } catch (err) {
    // With responseType "blob" the backend's error message arrives as a blob too.
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      const body = await err.response.data.text().catch(() => "")
      const message = (() => {
        try {
          return (JSON.parse(body) as { message?: string }).message
        } catch {
          return undefined
        }
      })()
      if (message) throw new Error(message)
    }
    throw new Error(apiErrorMessage(err, "Couldn't download the invoice. Try again."))
  }
}
