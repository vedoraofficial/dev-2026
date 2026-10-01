import { useState } from "react"

import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const notifications = [
  ["Income credited", "Every commission posted to your wallet"],
  ["New downline joining", "Anyone placed under your 5 levels"],
  ["Withdrawal status", "Approved, rejected or credited"],
]

/** 0–4: length ≥ 8, a number, a symbol, length ≥ 12 */
function passwordStrength(value: string): number {
  return [
    value.length >= 8,
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
    value.length >= 12,
  ].filter(Boolean).length
}

const strengthLabel = [
  "",
  "Weak",
  "Fair",
  "Strong — 8+ characters with a number and symbol",
  "Very strong",
]

export function PartnerSettingsPage() {
  const [next, setNext] = useState("")
  const strength = passwordStrength(next)

  return (
    <>
      <PageHeader title="Settings" subtitle="Security, notifications and preferences" />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Change password" />
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="current" className="eyebrow">
                  Current password
                </Label>
                <Input id="current" type="password" autoComplete="current-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new" className="eyebrow">
                  New password
                </Label>
                <Input
                  id="new"
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                />
                <div className="grid grid-cols-4 gap-1.5 pt-1" aria-hidden>
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={cn("h-1 rounded-full", n <= strength ? "bg-success" : "bg-forest")}
                    />
                  ))}
                </div>
                <p className="min-h-4 text-[0.6875rem] text-muted-foreground" aria-live="polite">
                  {strengthLabel[strength]}
                </p>
              </div>
              <Button type="submit">Update password</Button>
            </form>
          </Panel>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader title="Notification preferences" />
              {notifications.map(([title, detail]) => (
                <div
                  key={title}
                  className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-[0.875rem] font-medium">{title}</p>
                    <p className="text-[0.6875rem] text-muted-foreground">{detail}</p>
                  </div>
                  <Switch defaultChecked aria-label={title} />
                </div>
              ))}
            </Panel>

            <Panel className="border-danger/25">
              <h2 className="text-[0.9375rem] font-medium text-danger">Deactivate account</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Your VEDORA ID and downline placements stay permanently in the genealogy tree.
                Deactivation only stops new income and logins.
              </p>
              <Button variant="destructive" className="mt-4">
                Request deactivation
              </Button>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
