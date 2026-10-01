import { useMemo, useState } from "react"

import { ROUTES } from "@/app/routes"
import { FilterSelect } from "@/components/common/filter-select"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import {
  actionQueue,
  activityLog,
  founderLegs,
  OVERVIEW_PERIODS,
  overviewStats as stats,
  weeklyTrendByPeriod,
  type OverviewPeriod,
} from "@/features/overview/mock-data"
import { formatCompactINR, formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const totalLegPartners = founderLegs.reduce((sum, leg) => sum + leg.partners, 0)

const periodChartLabel: Record<OverviewPeriod, string> = {
  "This month": "this month",
  "Last month": "last month",
  "Last 12 weeks": "last 12 weeks",
}

export function AdminOverviewPage() {
  const [period, setPeriod] = useState<OverviewPeriod>(OVERVIEW_PERIODS[0])
  const weeklyTrend = weeklyTrendByPeriod[period]
  const maxBv = useMemo(() => Math.max(...weeklyTrend.map((w) => w.bv)), [weeklyTrend])

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={
          <>
            Root Admin <MonoId tone="gold">VED108</MonoId> · network health, 18 Sep 2026
          </>
        }
        actions={
          <FilterSelect
            label="Period"
            options={[...OVERVIEW_PERIODS]}
            defaultValue={period}
            onValueChange={(value) => setPeriod(value as OverviewPeriod)}
          />
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard
            href={ROUTES.admin.partners}
            label="Total partners"
            value={formatNumber(stats.totalPartners)}
            hint={<span className="text-success">▲ {stats.joinedThisMonth} this month</span>}
          />
          <StatCard
            href={ROUTES.admin.products}
            label="Product sales"
            value={formatNumber(stats.productSales)}
            hint={`${formatNumber(stats.bvGenerated)} BV generated`}
          />
          <StatCard
            href={ROUTES.admin.incomeReports}
            label="Commission paid"
            value={formatCompactINR(stats.commissionPaid)}
            hint={`${formatINR(stats.commissionPerSale)} × ${formatNumber(stats.productSales)} sales`}
          />
          <StatCard
            href={ROUTES.admin.withdrawals}
            label="Needs your action"
            value={stats.pendingWithdrawals}
            hint={`withdrawals · ${formatCompactINR(stats.pendingPayout)}`}
          />
        </StatGrid>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader
                title={`Joinings & BV — ${periodChartLabel[period]}`}
                aside={
                  <span className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-[2px] bg-gold" /> Joinings
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-[2px] bg-chart-5" /> BV
                    </span>
                  </span>
                }
              />
              <div
                role="img"
                aria-label={`Bar chart of weekly joinings and BV for the ${periodChartLabel[period]}`}
                className="flex h-56 items-end gap-1.5 sm:h-72 md:gap-3 lg:h-[21rem]"
              >
                {weeklyTrend.map((w) => (
                  <div
                    key={w.week}
                    className="relative flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-t-md bg-chart-5"
                    style={{ height: `${(w.bv / maxBv) * 100}%` }}
                  >
                    <div className="bg-gold" style={{ height: `${(w.joinings / w.bv) * 100}%` }} />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Founder legs — network share" />
              <ul className="space-y-4">
                {founderLegs.map((leg) => (
                  <li
                    key={leg.id}
                    className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[6.5rem_1fr_auto]"
                  >
                    <MonoId tone="gold">{leg.id}</MonoId>
                    {/* Phones: ID + count on the first row, bar full-width beneath. sm+: ID | bar | count. */}
                    <div className="order-3 col-span-2 h-2.5 overflow-hidden rounded-full bg-forest/60 sm:order-none sm:col-span-1">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${(leg.partners / totalLegPartners) * 100}%` }}
                      />
                    </div>
                    <span className="text-right text-xs text-muted-foreground">
                      {formatNumber(leg.partners)} partners
                    </span>
                  </li>
                ))}
              </ul>
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
                        item.tone === "danger"
                          ? "bg-danger-soft text-danger"
                          : "bg-accent text-foreground",
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
              <ul>
                {activityLog.map((entry) => (
                  <li
                    key={entry.text}
                    className="flex gap-3 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        entry.recent ? "bg-gold" : "bg-muted-foreground/40",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] text-foreground/90">{entry.text}</p>
                      <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{entry.meta}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
