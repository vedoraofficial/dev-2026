import type { ReactNode } from "react"

import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="eyebrow">
        {label}
      </Label>
      <Input id={id} {...props} />
    </div>
  )
}

function PlacementRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[0.8125rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}

export function PartnerProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Personal and bank payout information"
        actions={
          <>
            <Button variant="quiet">Cancel</Button>
            <Button>Save changes</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <Panel className="flex flex-col items-center text-center">
              <PersonAvatar size="xl" />
              <h2 className="mt-4 text-lg font-semibold">Rohit Deshmukh</h2>
              <MonoId tone="gold" className="mt-0.5">
                VED000418
              </MonoId>
              <StatusPill variant="success" className="mt-3">
                Verified partner
              </StatusPill>
              <Button variant="outline" className="mt-5 w-full">
                Change photo
              </Button>
            </Panel>

            <Panel>
              <p className="mb-4 eyebrow">Placement</p>
              <dl className="space-y-3">
                <PlacementRow label="Sponsor">
                  <MonoId>VED000301</MonoId>
                </PlacementRow>
                <PlacementRow label="Slot under sponsor">
                  <MonoId className="text-[0.8125rem]">07 / 20</MonoId>
                </PlacementRow>
                <PlacementRow label="Joined">14 Mar 2026</PlacementRow>
              </dl>
              <p className="mt-4 rounded-xl border border-border bg-field/60 p-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
                Placement and sponsor cannot be changed once registered — contact Admin for
                corrections.
              </p>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader title="Personal details" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="name"
                  label="Full name"
                  defaultValue="Rohit Deshmukh"
                  autoComplete="name"
                />
                <Field
                  id="mobile"
                  label="Mobile"
                  type="tel"
                  inputMode="tel"
                  defaultValue="+91 98220 41288"
                  autoComplete="tel"
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  defaultValue="rohit.d@example.com"
                  autoComplete="email"
                />
                <Field
                  id="city"
                  label="City / State"
                  defaultValue="Pune, Maharashtra"
                  autoComplete="address-level2"
                />
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Bank details for payout"
                aside={<StatusPill variant="success">Verified</StatusPill>}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="holder" label="Account holder" defaultValue="Rohit S Deshmukh" />
                <Field
                  id="account"
                  label="Account number"
                  inputMode="numeric"
                  defaultValue="•••• •••• 4821"
                  className="font-mono"
                />
                <Field
                  id="ifsc"
                  label="IFSC"
                  defaultValue="HDFC0001245"
                  autoCapitalize="characters"
                  className="font-mono uppercase"
                />
                <Field id="upi" label="UPI ID" defaultValue="rohitd@okhdfc" autoCapitalize="none" />
              </div>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
