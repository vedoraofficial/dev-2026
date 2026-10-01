/** Amounts in paise; `totalAmountFormatted` is the backend's ₹ text. */
export type PaymentMethod = "PHONEPE" | "WALLET" | "CASH"
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED"
export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "DELIVERED"

/** GET /api/order (mine) and GET /api/order/admin/all (everyone, with `user`) */
export type ApiOrder = {
  id: number
  product: { id: number; name: string }
  quantity: number
  totalAmount: number
  totalAmountFormatted: string
  bvTotal: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  commissionsDistributed?: boolean
  user?: { id: number; vedId: string; name: string }
  createdAt: string
}

/** GET /api/order/:id */
export type OrderDetail = Omit<ApiOrder, "product"> & {
  user: { id: number; vedId: string; name: string }
  product: { id: number; name: string; description: string | null }
  unitPrice: number
  phonepeMerchantOrderId: string | null
  commissionsDistributed: boolean
  commissions: {
    level: number
    beneficiary: { id: number; vedId: string; name: string }
    commissionRate: string
    amount: number
    amountFormatted: string
  }[]
}

/** POST /api/order — partners pay online (PHONEPE); CASH is admin-only. */
export type CreateOrderInput = {
  productId: number
  quantity: number
  paymentMethod: Exclude<PaymentMethod, "CASH">
}

export type CreatedOrder = {
  message: string
  order: {
    id: number
    productName: string
    quantity: number
    unitPrice: number
    totalAmount: number
    totalAmountFormatted: string
    bvTotal: number
    paymentMethod: PaymentMethod
    paymentStatus: PaymentStatus
    orderStatus: OrderStatus
    createdAt: string
  }
}

/** POST /api/order/admin/cash — [Admin] paid in cash, commissions go out at once. */
export type CashOrderInput = { userId: number; productId: number; quantity: number }
