import { CircleCheck } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatusPill } from "@/components/common/status-pill"
import { Timeline, type TimelineStep } from "@/components/common/timeline"
import { Button } from "@/components/ui/button"
import type { PickerProduct } from "@/features/placement/components/product-picker"
import type { PlacementResult } from "@/features/placement/mock-data"
import type { PlacementValues } from "@/features/placement/schemas"
import { formatBV, formatINR } from "@/lib/format"

/** How long each dummy delivery step takes to tick over (real tracking will come from Shiprocket). */
const STEP_MS = 1400

type Props = {
  values: PlacementValues
  product: PickerProduct & { name: string }
  result: PlacementResult
  upline: { id: string; name: string }
  /** The upline is the signed-in partner — the new ID is their Level 1. */
  uplineIsYou: boolean
  onPlaceAnother: () => void
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[0.8125rem]">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
    </div>
  )
}

const time = (d: Date) =>
  d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

export function PlacementSuccess({
  values,
  product,
  result,
  upline,
  uplineIsYou,
  onPlaceAnother,
}: Props) {
  const beyondCap = values.slot > 20

  // DUMMY delivery: steps tick over one by one until "Delivered".
  const steps: Omit<TimelineStep, "done">[] = [
    { title: "Order confirmed", meta: `Payment received · ${result.txnId}` },
    { title: "Packed at VEDORA warehouse", meta: "Pune, Maharashtra" },
    { title: "Shipped", meta: `${result.courier} · AWB ${result.awb}` },
    { title: "In transit", meta: `Reached ${values.shipCity} hub` },
    { title: "Out for delivery", meta: `${values.shipCity} · ${values.shipPincode}` },
    { title: "Delivered", meta: `Received by ${values.shipName}` },
  ]
  const [reached, setReached] = useState(1)
  useEffect(() => {
    if (reached >= steps.length) return
    const t = setTimeout(() => setReached((n) => n + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [reached, steps.length])
  const delivered = reached >= steps.length
  const current = steps[reached - 1]

  return (
    <div className="space-y-4 md:space-y-5">
      <Panel className="flex flex-wrap items-center gap-4 border-success/40 bg-success-soft/20">
        <CircleCheck className="size-10 shrink-0 text-success" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl leading-tight md:text-3xl">Payment successful</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatINR(product.price)} paid via {values.paymentMethod} ·{" "}
            <MonoId tone="muted">{result.txnId}</MonoId> · {time(result.paidAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="eyebrow text-[0.625rem]">New VEDORA ID</p>
          <MonoId tone="gold" className="text-lg">
            {result.vedoraId}
          </MonoId>
        </div>
      </Panel>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Placed in the tree"
            aside={
              beyondCap ? (
                <StatusPill variant="danger">Beyond 20 · no BV</StatusPill>
              ) : (
                <StatusPill variant="success">BV-eligible</StatusPill>
              )
            }
          />
          <div className="mb-5 flex flex-col items-center">
            <div className="w-full max-w-60 rounded-xl border border-border bg-field/60 p-3 text-center">
              <MonoId tone="gold" className="text-[0.6875rem]">
                {upline.id}
              </MonoId>
              <p className="mt-0.5 text-[0.8125rem] font-medium">
                {upline.name}
                {uplineIsYou ? " — You" : ""}
              </p>
            </div>
            <span aria-hidden className="h-6 w-px bg-gold/50" />
            <div className="w-full max-w-60 rounded-xl border border-gold bg-gold/10 p-3 text-center ring-3 ring-gold/20">
              <MonoId tone="gold" className="text-[0.6875rem]">
                {result.vedoraId}
              </MonoId>
              <p className="mt-0.5 text-[0.8125rem] font-medium">{values.fullName}</p>
              <p className="text-[0.6875rem] text-muted-foreground">
                Slot {String(values.slot).padStart(2, "0")}
                {uplineIsYou ? " · Level 1" : ""}
              </p>
            </div>
          </div>
          <dl className="space-y-2.5 border-t border-border/70 pt-4">
            <Row label="Upline / sponsor" value={<MonoId>{upline.id}</MonoId>} />
            <Row label="Slot" value={`${values.slot} of 20`} />
            {uplineIsYou ? <Row label="Level" value="Level 1 · your direct partner" /> : null}
            <Row label="Joined" value={time(result.paidAt)} />
            <Row label="Login" value={<MonoId>{result.vedoraId}</MonoId>} />
          </dl>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link to={ROUTES.partner.genealogy}>View in Genealogy Tree</Link>
          </Button>
        </Panel>

        <Panel>
          <PanelHeader
            title="Joining order"
            aside={<MonoId tone="gold">{result.orderId}</MonoId>}
          />
          <div className="flex gap-3">
            <img
              src={product.image}
              alt={product.name}
              width={1000}
              height={750}
              className="aspect-[4/3] w-24 shrink-0 rounded-lg border border-border object-cover"
            />
            <div className="min-w-0">
              <p className="text-[0.875rem] font-medium">{product.name}</p>
              <p className="text-[0.6875rem] text-muted-foreground">
                {product.gemstones.join(" · ")}
              </p>
              <p className="mt-1 font-mono text-xs text-gold-light">
                1 × {formatINR(product.price)} · {formatBV(product.bv)}
              </p>
            </div>
          </div>
          <dl className="mt-4 space-y-2.5 border-t border-border/70 pt-4">
            <Row label="Amount paid" value={formatINR(product.price)} />
            <Row label="Payment" value={values.paymentMethod} />
            <Row label="Transaction" value={<MonoId>{result.txnId}</MonoId>} />
          </dl>
          <div className="mt-4 rounded-xl border border-border bg-field/60 p-3.5 text-[0.8125rem] leading-relaxed">
            <p className="mb-1 eyebrow text-[0.625rem]">Shipping to</p>
            <p className="font-medium">{values.shipName}</p>
            <p className="text-muted-foreground">
              {values.shipLine1}
              {values.shipLandmark ? `, ${values.shipLandmark}` : ""}
              <br />
              {values.shipCity}, {values.shipState} – {values.shipPincode}
              <br />
              {values.shipMobile}
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Delivery tracking"
          aside={
            delivered ? (
              <StatusPill variant="success">Delivered</StatusPill>
            ) : (
              <StatusPill variant="pending">{current.title}</StatusPill>
            )
          }
        />
        <div aria-live="polite">
          <Timeline steps={steps.map((s, i) => ({ ...s, done: i < reached }))} />
        </div>
        <p className="mt-4 border-t border-border/70 pt-3 text-[0.6875rem] text-muted-foreground">
          Demo delivery — real courier tracking will come from Shiprocket once it is connected.
          {delivered ? " The 7-day warranty window starts today." : ""}
        </p>
      </Panel>

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline">
          <Link to={ROUTES.partner.orders}>Go to My Orders</Link>
        </Button>
        <Button onClick={onPlaceAnother}>Place another partner</Button>
      </div>
    </div>
  )
}
