import type { ReactNode } from "react"

import { MonoId } from "@/components/common/mono-id"
import { StatusPill } from "@/components/common/status-pill"
import { Timeline } from "@/components/common/timeline"
import { shipmentPill, STEPS } from "@/features/shipping/labels"
import type { OrderTracking } from "@/features/shipping/types"
import { formatDate, formatDateTime } from "@/lib/date"

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[0.8125rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

type Props = {
  tracking: OrderTracking
  /** e.g. a "Refresh" button */
  aside?: ReactNode
}

/** Courier, AWB, progress steps and every scan of one shipment. */
export function TrackingDetails({ tracking: t, aside }: Props) {
  const pill = shipmentPill(t.currentStatus)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill variant={pill.variant}>{pill.label}</StatusPill>
        {aside}
      </div>

      {t.awbCode ? (
        <dl className="space-y-2.5 rounded-xl border border-border bg-field/60 p-3.5">
          <Row label="Courier" value={t.courierName ?? "—"} />
          <Row label="AWB" value={<MonoId tone="gold">{t.awbCode}</MonoId>} />
          {t.estimatedDeliveryDate ? (
            <Row label="Expected by" value={formatDate(t.estimatedDeliveryDate)} />
          ) : null}
          {t.currentLocation ? <Row label="Now at" value={t.currentLocation} /> : null}
          {t.trackingUrl ? (
            <Row
              label="Courier page"
              value={
                <a
                  href={t.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold hover:underline"
                >
                  Open
                </a>
              }
            />
          ) : null}
        </dl>
      ) : (
        <p className="text-xs text-muted-foreground">
          No courier assigned yet — tracking appears here once the parcel is shipped.
        </p>
      )}

      <Timeline
        steps={STEPS.map((s) => ({
          title: s.title,
          done: t.stepper[s.key].completed,
          meta: t.stepper[s.key].timestamp ? formatDateTime(t.stepper[s.key].timestamp) : undefined,
        }))}
      />

      {t.activities.length > 0 ? (
        <div>
          <p className="mb-2 eyebrow">Courier scans</p>
          <ul className="divide-y divide-border/70 rounded-xl border border-border">
            {t.activities.map((a, i) => (
              <li key={`${a.date}-${i}`} className="px-3.5 py-2.5 text-[0.8125rem]">
                <p className="font-medium">{a.activity || a.status}</p>
                <p className="text-[0.6875rem] text-muted-foreground">
                  {[a.location, a.date].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[0.6875rem] text-muted-foreground">
        Last updated {formatDateTime(t.lastSyncedAt)}
      </p>
    </div>
  )
}
