import type { PillVariant } from "@/components/common/status-pill"
import type { ApiOrder, PaymentMethod } from "@/features/orders/types"

/** One status per order for tabs and pills, from the backend's payment + order status. */
export type OrderStage =
  | "awaiting"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "returned"
  | "cancelled"
  | "refunded"
  | "failed"

export function orderStage(o: Pick<ApiOrder, "paymentStatus" | "orderStatus">): OrderStage {
  if (o.paymentStatus === "REFUNDED") return "refunded"
  if (o.paymentStatus === "FAILED") return "failed"
  if (o.orderStatus === "CANCELLED") return "cancelled"
  if (o.orderStatus === "DELIVERED") return "delivered"
  if (o.orderStatus === "RTO") return "returned"
  if (o.orderStatus === "SHIPPED" || o.orderStatus === "PROCESSING") return "shipped"
  if (o.orderStatus === "CONFIRMED") return "confirmed"
  return "awaiting"
}

export const stagePill: Record<OrderStage, { label: string; variant: PillVariant }> = {
  awaiting: { label: "Awaiting payment", variant: "pending" },
  confirmed: { label: "Confirmed", variant: "gold" },
  shipped: { label: "Shipped", variant: "gold" },
  delivered: { label: "Delivered", variant: "success" },
  returned: { label: "Returned", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  refunded: { label: "Refunded", variant: "neutral" },
  failed: { label: "Failed", variant: "danger" },
}

export const STAGE_TABS: { value: "all" | OrderStage; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting", label: "Awaiting payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
]

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  RAZORPAY: "Razorpay",
  WALLET: "Wallet",
  CASH: "Cash",
}

/** Orders that can still be paid online. */
export const canPay = (o: Pick<ApiOrder, "paymentStatus" | "orderStatus" | "paymentMethod">) =>
  o.paymentMethod === "RAZORPAY" &&
  (o.paymentStatus === "PENDING" || o.paymentStatus === "FAILED") &&
  o.orderStatus !== "CANCELLED"

/** The backend lets a buyer cancel only an order that is not paid yet. */
export const canCancel = (o: Pick<ApiOrder, "paymentStatus" | "orderStatus">) =>
  o.paymentStatus === "PENDING" && o.orderStatus !== "CANCELLED"

/** [Admin] can also cancel a paid order — it is refunded to the buyer's wallet. */
export const canAdminCancel = (o: Pick<ApiOrder, "paymentStatus" | "orderStatus">) =>
  (o.paymentStatus === "PENDING" || o.paymentStatus === "PAID") && o.orderStatus !== "CANCELLED"

/** Paid and waiting for a courier (PROCESSING = sent to Shiprocket, no AWB yet). */
export const canShip = (o: Pick<ApiOrder, "paymentStatus" | "orderStatus">) =>
  o.paymentStatus === "PAID" && (o.orderStatus === "CONFIRMED" || o.orderStatus === "PROCESSING")

/** Has gone (or is going) out with a courier, so there is tracking to show. */
export const hasShipment = (o: Pick<ApiOrder, "orderStatus">) =>
  o.orderStatus === "PROCESSING" ||
  o.orderStatus === "SHIPPED" ||
  o.orderStatus === "DELIVERED" ||
  o.orderStatus === "RTO"

/** "ORD-00042" */
export const orderNo = (id: number) => `ORD-${String(id).padStart(5, "0")}`
