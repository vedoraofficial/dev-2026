import { useState } from "react"

import { ROUTES } from "@/app/routes"
import { FilterSelect } from "@/components/common/filter-select"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { useNetwork } from "@/features/genealogy/use-network"
import { orderNo, orderStage } from "@/features/orders/labels"
import { useAllOrders } from "@/features/orders/queries"
import { useCommissionLedger } from "@/features/orders/use-commission-ledger"
import { useAllWithdrawals } from "@/features/wallet/queries"
import { formatDate, startOfMonth, timeAgo } from "@/lib/date"
import { formatBV, formatCompactINR, formatINR, formatNumber } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

const PERIODS = ["This month", "Last month", "Last 12 weeks"] as const
type Period = (typeof PERIODS)[number]

/** [start, end) of the chosen period. */
function periodRange(period: Period): [Date, Date] {
  const now = new Date()
  if (period === "Last 12 weeks") return [new Date(now.getTime() - 84 * 864e5), now]
  const thisMonth = new Date(startOfMonth(now))
  if (period === "This month") return [thisMonth, now]
  return [new Date(now.getFullYear(), now.getMonth() - 1, 1), thisMonth]
}

export function AdminOverviewPage() {
  const adminId = useSession((s) => s.user?.vedId) ?? "VED108"
  const network = useNetwork(adminId)
  const orders = useAllOrders()
  const withdrawals = useAllWithdrawals()
  const ledger = useCommissionLedger()
  const [period, setPeriod] = useState<Period>(PERIODS[0])

  const members = network.data ?? []
  const partners = members.filter((m) => !m.isFounder)
  const founders = members.filter((m) => m.isFounder)
  const totalLegPartners = Math.max(
    1,
    founders.reduce((s, f) => s + f.team, 0),
  )

  const allOrders = orders.data ?? []
  const paid = allOrders.filter((o) => o.paymentStatus === "PAID")
  const units = paid.reduce((s, o) => s + o.quantity, 0)
  const bv = paid.reduce((s, o) => s + o.bvTotal, 0)
  const commission = (ledger.data ?? []).reduce((s, e) => s + e.amount, 0)
  const pendingWd = (withdrawals.data ?? []).filter((w) => w.status === "PENDING")
  const pendingPayout = pendingWd.reduce((s, w) => s + paiseToRupees(w.amount), 0)

  // Weekly BV and paid orders for the chosen period.
  const [from, to] = periodRange(period)
  const weeks = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (7 * 864e5)))
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    start: new Date(from.getTime() + i * 7 * 864e5),
    bv: 0,
    orders: 0,
  }))
  for (const o of paid) {
    const t = new Date(o.createdAt).getTime()
    if (t < from.getTime() || t >= to.getTime()) continue
    const b = buckets[Math.floor((t - from.getTime()) / (7 * 864e5))]
    if (b) {
      b.bv += o.bvTotal
      b.orders += 1
    }
  }
  const maxBv = Math.max(1, ...buckets.map((b) => b.bv))
  const maxOrders = Math.max(1, ...buckets.map((b) => b.orders))
  const periodBv = buckets.reduce((s, b) => s + b.bv, 0)

  const actionQueue = [
    { label: "Withdrawals to approve", count: pendingWd.length, danger: pendingWd.length > 0 },
    {
      label: "Orders awaiting payment",
      count: allOrders.filter((o) => orderStage(o) === "awaiting").length,
      danger: false,
    },
    {
      label: "Failed payments",
      count: allOrders.filter((o) => orderStage(o) === "failed").length,
      danger: false,
    },
    {
      label: "Partners not active",
      count: partners.filter((p) => p.status !== "ACTIVE").length,
      danger: false,
    },
  ]

  const activity = [
    ...allOrders.map((o) => ({
      at: o.createdAt,
      text: `${o.user?.name ?? "A partner"} ordered ${o.product.name} × ${o.quantity}`,
      meta: `${orderNo(o.id)} · ${formatINR(paiseToRupees(o.totalAmount))} · ${o.paymentStatus.toLowerCase()}`,
    })),
    ...(withdrawals.data ?? []).map((w) => ({
      at: w.createdAt,
      text: `${w.user.name} requested a withdrawal`,
      meta: `${formatINR(paiseToRupees(w.amount))} · ${w.status.toLowerCase()}`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6)

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={
          <>
            Root Admin <MonoId tone="gold">{adminId}</MonoId> · network health,{" "}
            {formatDate(new Date().toISOString())}
          </>
        }
        actions={
          <FilterSelect
            label="Period"
            options={[...PERIODS]}
            defaultValue={period}
            onValueChange={(value) => setPeriod(value as Period)}
          />
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard
            href={ROUTES.admin.partners}
            label="Total partners"
            value={network.data ? formatNumber(partners.length) : "—"}
            hint={`Under ${founders.length || 3} Founders`}
          />
          <StatCard
            href={ROUTES.admin.products}
            label="Product sales"
            value={orders.data ? formatNumber(units) : "—"}
            hint={`${formatNumber(bv)} BV generated`}
          />
          <StatCard
            href={ROUTES.admin.incomeReports}
            label="Commission paid"
            value={ledger.data ? formatCompactINR(commission) : "—"}
            hint={`${formatNumber(paid.length)} paid orders`}
          />
          <StatCard
            href={ROUTES.admin.withdrawals}
            label="Needs your action"
            value={pendingWd.length}
            hint={`withdrawals · ${formatCompactINR(pendingPayout)}`}
          />
        </StatGrid>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader
                title={`Paid orders & BV — ${period.toLowerCase()}`}
                aside={
                  <span className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-[2px] bg-gold" /> Orders
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-[2px] bg-chart-5" /> BV
                    </span>
                  </span>
                }
              />
              <QueryState query={orders} rows={4}>
                <div
                  role="img"
                  aria-label={`Weekly paid orders and BV, ${period.toLowerCase()}: ${formatBV(periodBv)} in total`}
                  className="flex h-56 items-end gap-1.5 sm:h-72 md:gap-3 lg:h-[21rem]"
                >
                  {buckets.map((b) => (
                    <div
                      key={b.start.toISOString()}
                      className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5"
                      title={`Week of ${formatDate(b.start.toISOString())}: ${b.orders} orders · ${formatBV(b.bv)}`}
                    >
                      <div
                        className="w-1/2 rounded-t-md bg-gold"
                        style={{ height: `${Math.max(1, (b.orders / maxOrders) * 100)}%` }}
                      />
                      <div
                        className="w-1/2 rounded-t-md bg-chart-5"
                        style={{ height: `${Math.max(1, (b.bv / maxBv) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
              </QueryState>
            </Panel>

            <Panel>
              <PanelHeader title="Founder legs — network share" />
              <QueryState query={network} rows={3}>
                <ul className="space-y-4">
                  {founders.map((leg) => (
                    <li
                      key={leg.vedId}
                      className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[6.5rem_1fr_auto]"
                    >
                      <MonoId tone="gold">{leg.vedId}</MonoId>
                      <div className="order-3 col-span-2 h-2.5 overflow-hidden rounded-full bg-forest/60 sm:order-none sm:col-span-1">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${(leg.team / totalLegPartners) * 100}%` }}
                        />
                      </div>
                      <span className="text-right text-xs text-muted-foreground">
                        {formatNumber(leg.team)} partners
                      </span>
                    </li>
                  ))}
                </ul>
              </QueryState>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader title="Action queue" />
              <ul>
                {actionQueue.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-3 border-b border-border/70 py-3.5 text-[0.8125rem] first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <span className="text-foreground/85">{item.label}</span>
                    <span
                      className={cn(
                        "grid h-6 min-w-7 place-items-center rounded-full px-2 text-xs font-medium",
                        item.danger ? "bg-danger-soft text-danger" : "bg-accent text-foreground",
                      )}
                    >
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <PanelHeader title="Activity log" />
              {activity.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul>
                  {activity.map((entry, i) => (
                    <li
                      key={`${entry.at}-${i}`}
                      className="flex gap-3 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          i < 2 ? "bg-gold" : "bg-muted-foreground/40",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-[0.8125rem] text-foreground/90">{entry.text}</p>
                        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                          {entry.meta} · {timeAgo(entry.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
