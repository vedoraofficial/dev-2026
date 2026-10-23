import { RefreshCw } from "lucide-react"

import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { TrackingDetails } from "@/features/shipping/components/tracking-details"
import { useOrderTracking, useSyncTracking } from "@/features/shipping/queries"

/** "Delivery" section of an order: live tracking, with a Refresh button once there is an AWB. */
export function OrderTrackingSection({ orderId }: { orderId: number }) {
  const tracking = useOrderTracking(orderId)
  const sync = useSyncTracking()
  const awb = tracking.data?.awbCode

  return (
    <div>
      <p className="mb-2 eyebrow">Delivery</p>
      <QueryState query={tracking} rows={2}>
        {tracking.data ? (
          <TrackingDetails
            tracking={tracking.data}
            aside={
              awb ? (
                <Button
                  variant="quiet"
                  size="sm"
                  disabled={sync.isPending}
                  onClick={() => sync.mutate(awb)}
                >
                  <RefreshCw className={sync.isPending ? "animate-spin" : undefined} aria-hidden />
                  {sync.isPending ? "Refreshing…" : "Refresh"}
                </Button>
              ) : null
            }
          />
        ) : null}
      </QueryState>
    </div>
  )
}
