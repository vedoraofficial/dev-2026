import { CircleCheck } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import type { PickerProduct } from "@/features/placement/components/product-picker"
import type { PlacementValues } from "@/features/placement/schemas"
import { formatBV, formatINR } from "@/lib/format"

/** The partner the backend created (POST /api/partner/register-downline → `partner`). */
export type RegisteredPartner = {
  vedId: string
  name: string
  email: string
  mobile: string
  status: string
  slotNumber: number
  depth: number
  /** Who enrolled the partner — earns the ₹200 direct commission (the signed-in user) */
  sponsorVedId: string
  sponsorName: string
  /** Tree parent, when the partner was placed under a team member */
  placedUnderVedId?: string
  placedUnderName?: string
}

type Props = {
  partner: RegisteredPartner
  values: PlacementValues
  product: PickerProduct & { name: string }
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

/** Shown after a successful Manual Placement — every value comes from the backend's response. */
export function PlacementSuccess({ partner, values, product, onPlaceAnother }: Props) {
  const parentVedId = partner.placedUnderVedId ?? partner.sponsorVedId
  const parentName = partner.placedUnderName ?? partner.sponsorName
  const underYou = parentVedId === partner.sponsorVedId
  return (
    <div className="space-y-4 md:space-y-5">
      <Panel className="flex flex-wrap items-center gap-4 border-success/40 bg-success-soft/20">
        <CircleCheck className="size-10 shrink-0 text-success" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl leading-tight md:text-3xl">Partner registered</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {partner.name} can now sign in with this ID and the password you set.
          </p>
        </div>
        <div className="text-right">
          <p className="eyebrow text-[0.625rem]">New VEDORA ID</p>
          <MonoId tone="gold" className="text-lg">
            {partner.vedId}
          </MonoId>
        </div>
      </Panel>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Placed in the tree"
            aside={<StatusPill variant="pending">{partner.status}</StatusPill>}
          />
          <div className="mb-5 flex flex-col items-center">
            <div className="w-full max-w-60 rounded-xl border border-border bg-field/60 p-3 text-center">
              <MonoId tone="gold" className="text-[0.6875rem]">
                {parentVedId}
              </MonoId>
              <p className="mt-0.5 text-[0.8125rem] font-medium">
                {parentName}
                {underYou ? " — You" : ""}
              </p>
            </div>
            <span aria-hidden className="h-6 w-px bg-gold/50" />
            <div className="w-full max-w-60 rounded-xl border border-gold bg-gold/10 p-3 text-center ring-3 ring-gold/20">
              <MonoId tone="gold" className="text-[0.6875rem]">
                {partner.vedId}
              </MonoId>
              <p className="mt-0.5 text-[0.8125rem] font-medium">{partner.name}</p>
              <p className="text-[0.6875rem] text-muted-foreground">
                Slot {String(partner.slotNumber).padStart(2, "0")} · Level 1
              </p>
            </div>
          </div>
          <dl className="space-y-2.5 border-t border-border/70 pt-4">
            <Row
              label="Sponsor · ₹200 direct"
              value={
                <>
                  <MonoId>{partner.sponsorVedId}</MonoId> (You)
                </>
              }
            />
            {underYou ? null : (
              <Row
                label="Placed under"
                value={
                  <>
                    {parentName} <MonoId>{parentVedId}</MonoId>
                  </>
                }
              />
            )}
            <Row label="Slot" value={`${partner.slotNumber} of 20`} />
            <Row label="Depth in tree" value={partner.depth} />
            <Row label="Email" value={partner.email} />
            <Row label="Mobile" value={partner.mobile} />
            <Row label="Login" value={<MonoId>{partner.vedId}</MonoId>} />
          </dl>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link to={ROUTES.partner.genealogy}>View in Genealogy Tree</Link>
          </Button>
        </Panel>

        <Panel>
          <PanelHeader title="Joining order" aside={<StatusPill>Not sent</StatusPill>} />
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
          <div className="mt-4 rounded-xl border border-border bg-field/60 p-3.5 text-[0.8125rem] leading-relaxed">
            <p className="mb-1 eyebrow text-[0.625rem]">Ship to</p>
            <p className="font-medium">{values.shipName}</p>
            <p className="text-muted-foreground">
              {values.shipLine1}
              {values.shipArea ? `, ${values.shipArea}` : ""}
              {values.shipLandmark ? `, ${values.shipLandmark}` : ""}
              <br />
              {values.shipCity}, {values.shipState} – {values.shipPincode}
              <br />
              {values.shipMobile}
            </p>
          </div>
          <p className="mt-4 text-[0.6875rem] leading-relaxed text-muted-foreground">
            The backend has no joining-order API yet, so this order was not created. The new partner
            can sign in and order from Products, which goes through PhonePe.
          </p>
        </Panel>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline">
          <Link to={ROUTES.partner.team}>Go to My Team</Link>
        </Button>
        <Button onClick={onPlaceAnother}>Place another partner</Button>
      </div>
    </div>
  )
}
