import type { ReactNode } from "react"

import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const constants = [
  ["Root admin ID", "VED108"],
  ["Founder IDs", "…001 / 002 / 003"],
  ["Max direct partners", "20"],
  ["Tree depth", "Unlimited"],
  ["Direct commission", "₹200"],
  ["BV split L1–L5", "10/10/10/5/5 %"],
]

const roles = [
  { name: "Root Admin", detail: "VED108 · full access", locked: true },
  { name: "Finance Operator", detail: "Withdrawals, transactions, reports" },
  { name: "Support Executive", detail: "Partners, PAN checks, placement queue" },
  { name: "Content Manager", detail: "Products, news, notifications" },
]

function ToggleRow({
  title,
  detail,
  defaultChecked,
}: {
  title: string
  detail: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[0.875rem] font-medium">{title}</p>
        <p className="text-[0.6875rem] text-muted-foreground">{detail}</p>
      </div>
      <Switch defaultChecked={defaultChecked} aria-label={title} />
    </div>
  )
}

function InfoRow({ title, detail, value }: { title: string; detail: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[0.875rem] font-medium">{title}</p>
        <p className="text-[0.6875rem] text-muted-foreground">{detail}</p>
      </div>
      <span className="shrink-0 text-xs">{value}</span>
    </div>
  )
}

function SettingField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="eyebrow">
        {label}
      </Label>
      <Input id={id} defaultValue={value} />
    </div>
  )
}

export function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="System configuration, roles and compensation constants"
        actions={<Button>Save settings</Button>}
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader
                title="Compensation plan constants"
                aside={
                  <span className="rounded-full border border-danger/40 px-2.5 py-0.5 text-[0.6875rem] text-danger">
                    Locked in production
                  </span>
                }
              />
              <div className="grid grid-cols-2 gap-3">
                {constants.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border bg-field/60 p-3.5">
                    <p className="eyebrow text-[0.625rem]">{label}</p>
                    <p className="mt-1.5 font-mono text-[0.875rem]">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[0.6875rem] leading-relaxed text-muted-foreground">
                These values are enforced in the database and commission engine. They are shown
                read-only so the plan cannot be altered after go-live — changes require a versioned
                release.
              </p>
            </Panel>

            <Panel>
              <PanelHeader title="Admin roles & access" />
              <ul>
                {roles.map((role) => (
                  <li
                    key={role.name}
                    className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[0.875rem] font-medium">{role.name}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">{role.detail}</p>
                    </div>
                    {role.locked ? (
                      <span className="text-[0.6875rem] text-muted-foreground">Permanent</span>
                    ) : (
                      <button
                        type="button"
                        className="px-2 py-1 text-xs font-medium text-gold hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-4">
                Add admin user
              </Button>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader title="Payment gateways" />
              <ToggleRow title="Razorpay" detail="Primary · collection & payout" defaultChecked />
              <ToggleRow title="PhonePe" detail="Secondary · UPI collection" defaultChecked />
            </Panel>

            <Panel>
              <PanelHeader title="Withdrawal policy" />
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingField id="minPayout" label="Minimum payout" value="₹ 1,000" />
                <SettingField id="fee" label="Processing fee" value="2 %" />
                <SettingField id="window" label="Settlement window" value="24 hours" />
                <SettingField
                  id="pan"
                  label="PAN verification"
                  value="Required before first payout"
                />
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="System" />
              <ToggleRow title="Maintenance mode" detail="Blocks partner logins during releases" />
              <InfoRow
                title="Database backup"
                detail="MySQL · daily 02:00 IST"
                value={<span className="text-success">Healthy</span>}
              />
              <InfoRow
                title="Audit log retention"
                detail="All commission entries kept permanently"
                value={<span className="text-muted-foreground">Permanent</span>}
              />
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
