import type { CreateShipmentInput, OrderTracking, Shipment } from "@/features/shipping/types"
import { api } from "@/lib/api"

/** GET /api/shipping/track/order/:orderId — the buyer's own order, or any order for Admin. */
export async function getOrderTracking(orderId: number): Promise<OrderTracking> {
  const { data } = await api.get<OrderTracking>(`/shipping/track/order/${orderId}`)
  return data
}

/** GET /api/shipping/track/public/:awbCode — no sign-in needed. */
export async function getPublicTracking(awbCode: string): Promise<OrderTracking> {
  const { data } = await api.get<OrderTracking>(
    `/shipping/track/public/${encodeURIComponent(awbCode)}`,
  )
  return data
}

/** POST /api/shipping/shipment/create — [Admin] book the courier in Shiprocket and get an AWB. */
export async function createShipment(input: CreateShipmentInput): Promise<Shipment> {
  const { data } = await api.post<Shipment>("/shipping/shipment/create", input)
  return data
}

/** POST /api/shipping/track/sync/:awbCode — fetch the latest scans from Shiprocket now. */
export async function syncTracking(awbCode: string): Promise<Shipment | null> {
  const { data } = await api.post<Shipment | null>(
    `/shipping/track/sync/${encodeURIComponent(awbCode)}`,
  )
  return data
}

/* POST /api/shipping/webhook/tracking is called by Shiprocket itself, never by this app. */
