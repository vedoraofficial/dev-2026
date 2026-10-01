import type { ReactNode } from "react"

import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { ChangePasswordForm } from "@/features/account/components/change-password-form"
import { PersonalDetailsForm } from "@/features/account/components/personal-details-form"
import { ProfileCard } from "@/features/account/components/profile-card"

function Row({ label, value }: { label: string; value: ReactNode }) {
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
      <PageHeader title="Profile" subtitle="Root Admin account details" />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <ProfileCard tone="gold" />

            <Panel>
              <p className="mb-4 eyebrow">Access</p>
              <dl className="space-y-3">
                <Row label="Role" value="Root Admin" />
                <Row label="Oversight" value="Whole network" />
                <Row label="Income" value={<span className="text-muted-foreground">None</span>} />
              </dl>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <PersonalDetailsForm />

            <Panel>
              <PanelHeader title="Change password" />
              <ChangePasswordForm className="max-w-md" />
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
