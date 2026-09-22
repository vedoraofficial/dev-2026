import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Panel } from "@/components/common/panel"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { founders } from "@/features/partners/mock-data"
import { formatBV, formatINR, formatNumber } from "@/lib/format"

export function AdminFoundersPage() {
  return (
    <>
      <PageHeader
        title="Founders"
        subtitle="VED000001 – VED000003 · fixed permanently, cannot be reassigned or regenerated"
      />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {founders.map((f) => (
            <Panel key={f.id} className="flex flex-col">
              <div className="flex items-center gap-4 border-b border-border/70 pb-4">
                <PersonAvatar tone="gold" size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-base leading-snug font-medium">{f.name}</h2>
                  <MonoId tone="gold" className="block">
                    {f.id}
                  </MonoId>
                  <p className="text-[0.6875rem] text-muted-foreground">Founder · topmost upline</p>
                </div>
              </div>

              <dl className="space-y-3 py-4 text-[0.8125rem]">
                <Row label="Upline" value={<MonoId>{f.upline}</MonoId>} />
                <Row
                  label="Direct slots"
                  value={<MonoId className="text-[0.8125rem]">{f.slotsUsed} / 20</MonoId>}
                />
                <Row label="Total downline" value={`${formatNumber(f.downline)} partners`} />
                <Row
                  label="BV under leg"
                  value={<span className="font-mono text-gold">{formatBV(f.bvUnderLeg)}</span>}
                />
                <Row
                  label="Income earned"
                  value={
                    <span className="font-mono text-success">{formatINR(f.incomeEarned)}</span>
                  }
                />
                <Row label="Member since" value={f.memberSince} />
                <Row label="Status" value={<StatusPill variant="success">Active</StatusPill>} />
              </dl>

              <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
                <Button asChild size="lg">
                  <Link to={`${ROUTES.admin.genealogy}?id=${f.id}`}>Open genealogy</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to={ROUTES.admin.incomeReports}>Income report</Link>
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      </PageBody>
    </>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
