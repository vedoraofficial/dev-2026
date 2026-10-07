import type { ReactNode } from "react"

import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { BankAccountsPanel } from "@/features/account/components/bank-accounts-panel"
import { PersonalDetailsForm } from "@/features/account/components/personal-details-form"
import { ProfileCard } from "@/features/account/components/profile-card"
import { ReferralLinkCard } from "@/features/genealogy/components/referral-link-card"
import { useMyGenealogy } from "@/features/genealogy/queries"
import { useSession } from "@/lib/session"

function PlacementRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[0.8125rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}

export function PartnerProfilePage() {
  const me = useSession((s) => s.user)
  const isFounder = me?.role === "FOUNDER"
  const genealogy = useMyGenealogy()
  const node = genealogy.data?.node

  return (
    <>
      <PageHeader title="Profile" subtitle="Personal and bank payout information" />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <ProfileCard tone={isFounder ? "gold" : "striped"} />
            {me ? <ReferralLinkCard vedId={me.vedId} /> : null}

            <Panel>
              <p className="mb-4 eyebrow">Placement</p>
              <QueryState query={genealogy} rows={3}>
                <dl className="space-y-3">
                  <PlacementRow label="Sponsor">
                    {node?.parent ? (
                      <MonoId>{node.parent.vedId}</MonoId>
                    ) : (
                      <span className="text-muted-foreground">None — top of the tree</span>
                    )}
                  </PlacementRow>
                  {node?.parent ? (
                    <PlacementRow label="Sponsor name">{node.parent.name}</PlacementRow>
                  ) : null}
                  <PlacementRow label="Slot under sponsor">
                    <MonoId className="text-[0.8125rem]">
                      {node?.slotNumber ? `${String(node.slotNumber).padStart(2, "0")} / 20` : "—"}
                    </MonoId>
                  </PlacementRow>
                  <PlacementRow label="Direct partners">
                    {genealogy.data?.directPartnersCount ?? 0} / {genealogy.data?.maxSlots ?? 20}
                  </PlacementRow>
                </dl>
              </QueryState>
              <p className="mt-4 rounded-xl border border-border bg-field/60 p-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
                Placement and sponsor cannot be changed once registered — contact Admin for
                corrections.
              </p>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <PersonalDetailsForm />
            <BankAccountsPanel />
          </div>
        </div>
      </PageBody>
    </>
  )
}
