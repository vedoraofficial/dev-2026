export type TrackingStep = { completed: boolean; timestamp: string | null }

/** GET /api/shipping/track/order/:orderId and /track/public/:awbCode */
export type OrderTracking = {
  orderId: number
  awbCode: string | null
  courierName: string | null
  /** A shipment status (AWB_ASSIGNED, IN_TRANSIT…), or the order's own status before shipping */
  currentStatus: string
  estimatedDeliveryDate: string | null
  currentLocation: string | null
  trackingUrl: string | null
  stepper: Record<
    "orderPlaced" | "processing" | "shipped" | "inTransit" | "outForDelivery" | "delivered",
    TrackingStep
  >
  activities: { date: string; status: string; activity: string; location: string }[]
  lastSyncedAt: string
}

/** POST /api/shipping/shipment/create — package size in cm, weight in kg (backend defaults 10 / 0.5). */
export type CreateShipmentInput = {
  orderId: number
  length?: number
  breadth?: number
  height?: number
  weight?: number
  courierId?: number
}

/** The shipment row the backend saves. */
export type Shipment = {
  id: number
  orderId: number
  shiprocketOrderId: string | null
  awbCode: string | null
  courierName: string | null
  currentStatus: string
  trackingUrl: string | null
}
