import type { PillVariant } from "@/components/common/status-pill"

export type OrderStatus =
  "delivered" | "shipped" | "confirmed" | "failed" | "refunding" | "refunded" | "cancelled"

export const orderStatusPill: Record<OrderStatus, { label: string; variant: PillVariant }> = {
  delivered: { label: "Delivered", variant: "success" },
  shipped: { label: "Shipped", variant: "pending" },
  confirmed: { label: "Confirmed", variant: "pending" },
  failed: { label: "Failed", variant: "danger" },
  refunding: { label: "Refunding", variant: "pending" },
  refunded: { label: "Refunded", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
}

export const orderTabs = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunds", label: "Refunds" },
]

/** Admin: all partners' orders. */
export type AdminOrder = {
  id: string
  partner: string
  partnerId: string
  items: string
  amount: number
  shipment: string
  status: OrderStatus
}

export const adminOrders: AdminOrder[] = [
  {
    id: "ORD-01204",
    partner: "Rohit Deshmukh",
    partnerId: "VED000418",
    items: "Protection × 2",
    amount: 3998,
    shipment: "BD1247902 · delivered",
    status: "delivered",
  },
  {
    id: "ORD-01198",
    partner: "Sneha Kulkarni",
    partnerId: "VED000455",
    items: "Wealth × 1",
    amount: 1999,
    shipment: "BD1247891 · in transit",
    status: "shipped",
  },
  {
    id: "ORD-01191",
    partner: "Imran Shaikh",
    partnerId: "VED000462",
    items: "Energy × 3",
    amount: 5997,
    shipment: "Awaiting dispatch",
    status: "confirmed",
  },
  {
    id: "ORD-01188",
    partner: "Pooja Nair",
    partnerId: "VED000568",
    items: "Balance × 5",
    amount: 9995,
    shipment: "Payment failed",
    status: "failed",
  },
  {
    id: "ORD-01184",
    partner: "Meera Joshi",
    partnerId: "VED000478",
    items: "Protection × 1",
    amount: 1999,
    shipment: "Cancelled pre-dispatch",
    status: "refunding",
  },
  {
    id: "ORD-01180",
    partner: "Akash Patil",
    partnerId: "VED000491",
    items: "Wealth × 1",
    amount: 1999,
    shipment: "Cancelled by partner — pre-dispatch",
    status: "cancelled",
  },
  {
    id: "ORD-01176",
    partner: "Karan Mehta",
    partnerId: "VED000512",
    items: "Balance × 2",
    amount: 3998,
    shipment: "Awaiting dispatch",
    status: "confirmed",
  },
  {
    id: "ORD-01172",
    partner: "Aditya Kale",
    partnerId: "VED000533",
    items: "Protection × 3",
    amount: 5997,
    shipment: "BD1247850 · in transit",
    status: "shipped",
  },
  {
    id: "ORD-01169",
    partner: "Farhan Qureshi",
    partnerId: "VED000549",
    items: "Energy × 1",
    amount: 1999,
    shipment: "Delivered 15 Sep",
    status: "delivered",
  },
]

/** Partner: the signed-in partner's own orders. */
export type PartnerOrder = {
  id: string
  product: string
  date: string
  amount: number
  delivery: string
  status: OrderStatus
  /** Courier tracking number once shipped */
  trackingId?: string
}

export const partnerOrders: PartnerOrder[] = [
  {
    id: "ORD-01204",
    product: "Protection Bracelet × 2",
    date: "18 Sep 2026",
    amount: 3998,
    delivery: "Delivered 20 Sep",
    status: "delivered",
  },
  {
    id: "ORD-01198",
    product: "Wealth Bracelet × 1",
    date: "16 Sep 2026",
    amount: 1999,
    delivery: "BD1247891 · in transit",
    status: "shipped",
    trackingId: "BD1247891",
  },
  {
    id: "ORD-01191",
    product: "Energy Bracelet × 3",
    date: "15 Sep 2026",
    amount: 5997,
    delivery: "Processing · 24–48 h",
    status: "confirmed",
  },
  {
    id: "ORD-01188",
    product: "Balance Bracelet × 5",
    date: "14 Sep 2026",
    amount: 9995,
    delivery: "Payment not received",
    status: "failed",
  },
  {
    id: "ORD-01183",
    product: "Protection Bracelet × 1",
    date: "13 Sep 2026",
    amount: 1999,
    delivery: "Processing · 24–48 h",
    status: "confirmed",
  },
  {
    id: "ORD-01177",
    product: "Energy Bracelet × 2",
    date: "12 Sep 2026",
    amount: 3998,
    delivery: "BD1247866 · out for delivery",
    status: "shipped",
    trackingId: "BD1247866",
  },
  {
    id: "ORD-01170",
    product: "Wealth Bracelet × 2",
    date: "10 Sep 2026",
    amount: 3998,
    delivery: "Cancelled by you · refund in 7–10 days",
    status: "refunding",
  },
  {
    id: "ORD-01162",
    product: "Balance Bracelet × 1",
    date: "14 Sep 2026",
    amount: 1999,
    delivery: "Delivered 17 Sep",
    status: "delivered",
  },
  {
    id: "ORD-01155",
    product: "Protection Bracelet × 3",
    date: "05 Sep 2026",
    amount: 5997,
    delivery: "Delivered 09 Sep",
    status: "delivered",
  },
  {
    id: "ORD-01149",
    product: "Energy Bracelet × 1",
    date: "03 Sep 2026",
    amount: 1999,
    delivery: "Cancelled by admin · stock unavailable",
    status: "cancelled",
  },
  {
    id: "ORD-01138",
    product: "Wealth Bracelet × 1",
    date: "29 Aug 2026",
    amount: 1999,
    delivery: "Refunded to UPI on 06 Sep",
    status: "refunded",
  },
  {
    id: "ORD-01166",
    product: "Protection Bracelet × 2",
    date: "11 Sep 2026",
    amount: 3998,
    delivery: "Card declined by bank",
    status: "failed",
  },
  {
    id: "ORD-01143",
    product: "Balance Bracelet × 2",
    date: "01 Sep 2026",
    amount: 3998,
    delivery: "Returned to warehouse · refund in progress",
    status: "refunding",
  },
]

/**
 * DUMMY: the 4 cards on My Orders, worked out from the sample list so the cards and the list
 * always agree. The real numbers come from GET /api/partner/orders/stats.
 */
export function partnerOrderStats(orders: PartnerOrder[]) {
  const sum = (list: PartnerOrder[]) => list.reduce((total, o) => total + o.amount, 0)
  const refunding = orders.filter((o) => o.status === "refunding")
  const inTransit = orders.filter((o) => o.status === "shipped")
  const failed = orders.filter((o) => o.status === "failed")
  return {
    totalOrders: orders.length,
    since: "Mar 2026",
    refunding: { count: refunding.length, amount: sum(refunding) },
    inTransit: inTransit.length,
    trackingIds: inTransit.flatMap((o) => (o.trackingId ? [o.trackingId] : [])),
    failed: { count: failed.length, amount: sum(failed) },
  }
}

export const deliverySla = [
  { zone: "Maharashtra", sla: "Up to 7 business days" },
  { zone: "Rest of India", sla: "Up to 14 business days" },
  { zone: "North East, J&K, Ladakh", sla: "Up to 14 business days" },
]

export const warrantyClaims = [
  {
    id: "WC-0042",
    partnerId: "VED000418",
    issue: "elastic defect",
    status: "Under review",
    variant: "pending" as const,
  },
  {
    id: "WC-0041",
    partnerId: "VED000455",
    issue: "bead chipped",
    status: "Approved",
    variant: "success" as const,
  },
  {
    id: "WC-0039",
    partnerId: "VED000491",
    issue: "water damage",
    status: "Rejected",
    variant: "danger" as const,
  },
]

export const shipmentTimeline = [
  { title: "Order confirmed", meta: "16 Sep · payment received", done: true },
  { title: "Dispatched from warehouse", meta: "17 Sep · tracking ID BD1247891", done: true },
  { title: "In transit — Pune hub", meta: "19 Sep · 09:14", done: true },
  {
    title: "Out for delivery",
    meta: "Est. by 23 Sep · Maharashtra, up to 7 business days",
    done: false,
  },
]
