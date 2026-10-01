import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ChangePasswordForm } from "@/features/account/components/change-password-form"

const notifications = [
  ["Income credited", "Every commission posted to your wallet"],
  ["New downline joining", "Anyone placed under your 5 levels"],
  ["Withdrawal status", "Approved, rejected or credited"],
]

export function PartnerSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Security, notifications and preferences" />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Change password" />
            <ChangePasswordForm />
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
