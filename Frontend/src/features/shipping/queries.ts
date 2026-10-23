import { useQuery } from "@tanstack/react-query"

import {
  createShipment,
  getOrderTracking,
  getPublicTracking,
  syncTracking,
} from "@/features/shipping/api"
import { useApiMutation } from "@/lib/mutation"

export const shippingKeys = {
  all: ["shipping"] as const,
  order: (orderId: number) => ["shipping", "order", orderId] as const,
  awb: (awbCode: string) => ["shipping", "awb", awbCode] as const,
}

export const useOrderTracking = (orderId: number) =>
  useQuery({
    queryKey: shippingKeys.order(orderId),
    queryFn: () => getOrderTracking(orderId),
  })

export const usePublicTracking = (awbCode: string | null) =>
  useQuery({
    queryKey: shippingKeys.awb(awbCode ?? ""),
    queryFn: () => getPublicTracking(awbCode ?? ""),
    enabled: !!awbCode,
    retry: false,
  })

/** [Admin] Shipping changes the order's status too — refresh orders and tracking. */
export const useCreateShipment = () =>
  useApiMutation(createShipment, {
    success: (s) =>
      s.awbCode
        ? `Shipment booked — AWB ${s.awbCode}${s.courierName ? ` (${s.courierName})` : ""}`
        : "Sent to Shiprocket, but no courier was assigned — check the Shiprocket wallet / pincode, then retry",
    invalidate: [["orders"], shippingKeys.all],
  })

export const useSyncTracking = () =>
  useApiMutation(syncTracking, {
    success: (s) => (s ? "Tracking updated from the courier" : "No shipment with this AWB"),
    invalidate: [["orders"], shippingKeys.all],
  })
