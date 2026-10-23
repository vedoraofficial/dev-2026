import type { PillVariant } from "@/components/common/status-pill"
import type { OrderTracking } from "@/features/shipping/types"

const STATUS: Record<string, { label: string; variant: PillVariant }> = {
  NEW: { label: "Booked", variant: "pending" },
  AWB_ASSIGNED: { label: "Courier assigned", variant: "gold" },
  LABEL_GENERATED: { label: "Label ready", variant: "gold" },
  PICKUP_SCHEDULED: { label: "Pickup scheduled", variant: "gold" },
  PICKED_UP: { label: "Picked up", variant: "gold" },
  IN_TRANSIT: { label: "In transit", variant: "gold" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", variant: "gold" },
  DELIVERED: { label: "Delivered", variant: "success" },
  RTO_INITIATED: { label: "Returning to us", variant: "danger" },
  RTO_DELIVERED: { label: "Returned", variant: "danger" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
  LOST: { label: "Lost", variant: "danger" },
  // Before a shipment exists the backend reports the order's own status.
  PENDING: { label: "Awaiting payment", variant: "pending" },
  CONFIRMED: { label: "Not shipped yet", variant: "neutral" },
  PROCESSING: { label: "Being packed", variant: "pending" },
  SHIPPED: { label: "Shipped", variant: "gold" },
}

/** Pill for a shipment status; unknown courier text is shown as it comes. */
export const shipmentPill = (status: string): { label: string; variant: PillVariant } =>
  STATUS[status] ?? { label: status.replaceAll("_", " ").toLowerCase(), variant: "neutral" }

export const STEPS: { key: keyof OrderTracking["stepper"]; title: string }[] = [
  { key: "orderPlaced", title: "Order placed" },
  { key: "processing", title: "Packed" },
  { key: "shipped", title: "Shipped" },
  { key: "inTransit", title: "In transit" },
  { key: "outForDelivery", title: "Out for delivery" },
  { key: "delivered", title: "Delivered" },
]
