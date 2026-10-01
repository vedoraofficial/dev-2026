import type { PillVariant } from "@/components/common/status-pill"
import type { ApiOrder, PaymentMethod } from "@/features/orders/types"

/** One status per order for tabs and pills, from the backend's payment + order status. */
export type OrderStage =
  "awaiting" | "confirmed" | "delivered" | "cancelled" | "refunded" | "failed"

export function orderStage(o: Pick<ApiOrder, "paymentStatus" | "orderStatus">): OrderStage {
  if (o.paymentStatus === "REFUNDED") return "refunded"
  if (o.paymentStatus === "FAILED") return "failed"
  if (o.orderStatus === "CANCELLED") return "cancelled"
  if (o.orderStatus === "DELIVERED") return "delivered"
  if (o.orderStatus === "CONFIRMED") return "confirmed"
  return "awaiting"
}

export const stagePill: Record<OrderStage, { label: string; variant: PillVariant }> = {
  awaiting: { label: "Awaiting payment", variant: "pending" },
  confirmed: { label: "Confirmed", variant: "gold" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  refunded: { label: "Refunded", variant: "neutral" },
  failed: { label: "Failed", variant: "danger" },
}

export const STAGE_TABS: { value: "all" | OrderStage; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting", label: "Awaiting payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
]

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  PHONEPE: "PhonePe",
  WALLET: "Wallet",
  CASH: "Cash",
}

/** Orders that can still be paid online. */
export const canPay = (o: Pick<ApiOrder, "paymentStatus" | "orderStatus" | "paymentMethod">) =>
  o.paymentMethod === "PHONEPE" &&
  (o.paymentStatus === "PENDING" || o.paymentStatus === "FAILED") &&
  o.orderStatus !== "CANCELLED"

/** "ORD-00042" */
export const orderNo = (id: number) => `ORD-${String(id).padStart(5, "0")}`
