import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { useNetwork } from "@/features/genealogy/use-network"
import { useAllOrders } from "@/features/orders/queries"
import { useCommissionLedger } from "@/features/orders/use-commission-ledger"
import { formatBV, formatINR, formatNumber } from "@/lib/format"
import { useSession } from "@/lib/session"

export function AdminFoundersPage() {
  const adminId = useSession((s) => s.user?.vedId)
  const network = useNetwork(adminId)
  const orders = useAllOrders()
  const ledger = useCommissionLedger()

  const members = network.data ?? []
  const legOf = new Map(members.map((m) => [m.vedId, m.founderId]))
  const founders = members.filter((m) => m.isFounder)

  // BV from paid orders bought by anyone in the leg (the Founder included).
  const bvByLeg = new Map<string, number>()
  for (const o of orders.data ?? []) {
    const leg = o.user ? legOf.get(o.user.vedId) : undefined
    if (leg && o.paymentStatus === "PAID") bvByLeg.set(leg, (bvByLeg.get(leg) ?? 0) + o.bvTotal)
  }
  const earned = (vedId: string) =>
    (ledger.data ?? []).filter((e) => e.recipient.vedId === vedId).reduce((s, e) => s + e.amount, 0)

  return (
    <>
      <PageHeader
        title="Founders"
        subtitle="VED000001 – VED000003 · fixed permanently, cannot be reassigned or regenerated"
      />
      <PageBody>
        <QueryState query={network} rows={3}>
          <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {founders.map((f) => (
              <Panel key={f.vedId} className="flex flex-col">
                <div className="flex items-center gap-4 border-b border-border/70 pb-4">
                  <PersonAvatar tone="gold" size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-base leading-snug font-medium">{f.name}</h2>
                    <MonoId tone="gold" className="block">
                      {f.vedId}
                    </MonoId>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      Founder · topmost upline
                    </p>
                  </div>
                </div>

                <dl className="space-y-3 py-4 text-[0.8125rem]">
                  <Row label="Upline" value={<MonoId>{f.sponsor}</MonoId>} />
                  <Row
                    label="Direct slots"
                    value={<MonoId className="text-[0.8125rem]">{f.direct} / 20</MonoId>}
                  />
                  <Row label="Total downline" value={`${formatNumber(f.team)} partners`} />
                  <Row
                    label="BV under leg"
                    value={
                      <span className="font-mono text-gold">
                        {orders.data ? formatBV(bvByLeg.get(f.vedId) ?? 0) : "—"}
                      </span>
                    }
                  />
                  <Row
                    label="Income earned"
                    value={
                      <span className="font-mono text-success">
                        {ledger.data ? formatINR(earned(f.vedId)) : "—"}
                      </span>
                    }
                  />
                  <Row label="Status" value={<StatusPill variant="success">Active</StatusPill>} />
                </dl>

                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
                  <Button asChild size="lg">
                    <Link to={`${ROUTES.admin.genealogy}?id=${f.vedId}`}>Open genealogy</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to={ROUTES.admin.incomeReports}>Income report</Link>
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        </QueryState>
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
