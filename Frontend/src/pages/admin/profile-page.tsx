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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[0.8125rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

export function AdminProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Root Admin account details"
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
              <PersonAvatar tone="gold" size="xl" />
              <h2 className="mt-4 text-lg font-medium">Root Admin</h2>
              <MonoId tone="gold" className="mt-0.5">
                VED108
              </MonoId>
              <StatusPill variant="gold" className="mt-3">
                Full access
              </StatusPill>
              <Button variant="outline" className="mt-5 w-full">
                Change photo
              </Button>
            </Panel>

            <Panel>
              <p className="mb-4 eyebrow">Access</p>
              <dl className="space-y-3">
                <Row label="Role" value="Root Admin" />
                <Row label="Oversight" value="Whole network" />
                <Row label="Income" value={<span className="text-muted-foreground">None</span>} />
              </dl>
              <p className="mt-4 rounded-xl border border-border bg-field/60 p-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
                VED108 is permanent and cannot be reassigned. To add operators with limited access,
                use Settings → Admin roles &amp; access.
              </p>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader title="Personal details" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="name" label="Full name" defaultValue="Root Admin" autoComplete="name" />
                <Field
                  id="mobile"
                  label="Mobile"
                  type="tel"
                  inputMode="tel"
                  defaultValue="+91 98200 00108"
                  autoComplete="tel"
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  defaultValue="admin@vedoraofficial.in"
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
              <PanelHeader title="Change password" />
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
                <Field
                  id="current"
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                />
                <Field id="new" label="New password" type="password" autoComplete="new-password" />
                <Button type="submit" className="sm:col-span-2 sm:w-fit">
                  Update password
                </Button>
              </form>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
