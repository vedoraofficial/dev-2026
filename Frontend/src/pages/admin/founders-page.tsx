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
        actions={
          <Button variant="quiet" disabled>
            Add founder — disabled
          </Button>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {founders.map((f) => (
            <Panel key={f.id} className="flex flex-col">
              <div className="flex items-center gap-4 border-b border-border/70 pb-4">
                <PersonAvatar size="lg" />
                <div className="min-w-0">
                  <h2 className="text-base leading-snug font-semibold">{f.name}</h2>
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
                <Button size="lg" className="col-span-2">
                  Open genealogy
                </Button>
                <Button variant="outline">Income report</Button>
                <Button variant="quiet">Edit profile</Button>
              </div>
            </Panel>
          ))}
        </div>

        <Panel className="text-xs leading-relaxed text-muted-foreground">
          Founders sit directly under Root Admin <MonoId tone="gold">VED108</MonoId> and receive
          level income as topmost upline. Their IDs are permanent — the panel allows profile and
          status edits only; placement, ID and sponsor are locked at database level.
        </Panel>
      </PageBody>
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
