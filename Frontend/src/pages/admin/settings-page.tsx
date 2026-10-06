import { useState } from "react"
import { toast } from "sonner"

import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useMe } from "@/features/account/queries"
import { FOUNDER_IDS } from "@/features/genealogy/use-genealogy-tree"

/** Compensation-plan rules — fixed in the commission engine, not editable from the UI. */
const planConstants = [
  ["Max direct partners", "20"],
  ["Tree depth", "Unlimited"],
  ["Direct commission", "₹200"],
  ["BV split L1–L5", "10/10/10/5/5 %"],
]

type Settings = {
  phonepeEnabled: boolean
  maintenanceMode: boolean
  minPayout: string
  fee: string
  window: string
  pan: string
}

const initialSettings: Settings = {
  phonepeEnabled: true,
  maintenanceMode: false,
  minPayout: "₹ 1,000",
  fee: "2 %",
  window: "24 hours",
  pan: "Required before first payout",
}

function ToggleRow({
  title,
  detail,
  checked,
  onCheckedChange,
}: {
  title: string
  detail: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[0.875rem] font-medium">{title}</p>
        <p className="text-[0.6875rem] text-muted-foreground">{detail}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  )
}

function SettingField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="eyebrow">
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export function AdminSettingsPage() {
  const me = useMe()
  const admin = me.data
  const [saved, setSaved] = useState(initialSettings)
  const [draft, setDraft] = useState(initialSettings)
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const constants = [
    ["Root admin ID", admin?.vedId ?? "—"],
    ["Founder IDs", FOUNDER_IDS.join(" / ")],
    ...planConstants,
  ]

  const setField = (key: keyof Settings) => (value: string) =>
    setDraft((d) => ({ ...d, [key]: value }))
  const setToggle = (key: keyof Settings) => (checked: boolean) =>
    setDraft((d) => ({ ...d, [key]: checked }))

  const saveSettings = () => {
    setSaved(draft)
    toast.success("Settings saved")
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="System configuration, roles and compensation constants"
        actions={
          <Button disabled={!isDirty} onClick={saveSettings}>
            Save settings
          </Button>
        }
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
            </Panel>

            <Panel>
              <PanelHeader title="Admin roles & access" />
              <ul>
                <li className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-[0.875rem] font-medium">
                      {admin ? `${admin.name} · Root Admin` : "Loading…"}
                    </p>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      {admin ? `${admin.vedId} · full access` : ""}
                    </p>
                  </div>
                  <span className="text-[0.6875rem] text-muted-foreground">Permanent</span>
                </li>
              </ul>
              <p className="mt-3 text-[0.6875rem] text-muted-foreground">
                VEDORA currently has a single Admin role — sub-roles with limited access aren't
                supported by the backend yet.
              </p>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader title="Payment gateway" />
              <ToggleRow
                title="PhonePe"
                detail="Collection & payout"
                checked={draft.phonepeEnabled}
                onCheckedChange={setToggle("phonepeEnabled")}
              />
            </Panel>

            <Panel>
              <PanelHeader title="Withdrawal policy" />
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingField
                  id="minPayout"
                  label="Minimum payout"
                  value={draft.minPayout}
                  onChange={setField("minPayout")}
                />
                <SettingField
                  id="fee"
                  label="Processing fee"
                  value={draft.fee}
                  onChange={setField("fee")}
                />
                <SettingField
                  id="window"
                  label="Settlement window"
                  value={draft.window}
                  onChange={setField("window")}
                />
                <SettingField
                  id="pan"
                  label="PAN verification"
                  value={draft.pan}
                  onChange={setField("pan")}
                />
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="System" />
              <ToggleRow
                title="Maintenance mode"
                detail="Blocks partner logins during releases"
                checked={draft.maintenanceMode}
                onCheckedChange={setToggle("maintenanceMode")}
              />
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
