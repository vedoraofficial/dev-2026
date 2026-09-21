import type { PillVariant } from "@/components/common/status-pill"

export type OrderStatus = "delivered" | "shipped" | "confirmed" | "failed" | "refunding"

export const orderStatusPill: Record<OrderStatus, { label: string; variant: PillVariant }> = {
  delivered: { label: "Delivered", variant: "success" },
  shipped: { label: "Shipped", variant: "pending" },
  confirmed: { label: "Confirmed", variant: "pending" },
  failed: { label: "Failed", variant: "danger" },
  refunding: { label: "Refunding", variant: "pending" },
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
]

/** Partner: the signed-in partner's own orders. */
export type PartnerOrder = {
  id: string
  product: string
  date: string
  amount: number
  delivery: string
  status: OrderStatus
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
]

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
