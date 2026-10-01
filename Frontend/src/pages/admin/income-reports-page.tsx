import { useState } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { orderNo } from "@/features/orders/labels"
import {
  ledgerLevelLabel,
  useCommissionLedger,
  type LedgerEntry,
} from "@/features/orders/use-commission-ledger"
import { downloadCsv } from "@/lib/csv"
import { formatDate, formatDateTime, startOfMonth } from "@/lib/date"
import { formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const VIEW_OPTIONS = ["Date-wise", "Level-wise"]
const PERIODS = ["This month", "Last month", "All time"] as const
type Period = (typeof PERIODS)[number]

function inPeriod(iso: string, period: Period): boolean {
  if (period === "All time") return true
  const now = new Date()
  const thisMonth = startOfMonth(now)
  const day = iso.slice(0, 10)
  if (period === "This month") return day >= thisMonth
  const lastMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  return day >= lastMonth && day < thisMonth
}

/** Rows of the payout split: Direct + Levels 1–5. */
const SPLIT = [0, 1, 2, 3, 4, 5]
const barTone = (level: number) =>
  level === 0 ? "bg-gold" : level <= 3 ? "bg-chart-2" : "bg-chart-4"

const columns: Column<LedgerEntry>[] = [
  {
    key: "date",
    header: "Date",
    cell: (r) => <span className="text-muted-foreground">{formatDateTime(r.date)}</span>,
  },
  {
    key: "order",
    header: "Order",
    primary: true,
    cell: (r) => (
      <MonoId tone="gold" className="text-[0.8125rem]">
        {orderNo(r.orderId)}
      </MonoId>
    ),
  },
  { key: "seller", header: "Buyer", cell: (r) => <MonoId>{r.seller.vedId}</MonoId> },
  {
    key: "recipient",
    header: "Recipient",
    cell: (r) => (
      <span>
        <MonoId>{r.recipient.vedId}</MonoId>
        <span className="ml-1.5 text-[0.6875rem] text-muted-foreground">{r.recipient.name}</span>
      </span>
    ),
  },
  { key: "type", header: "Type", cell: (r) => ledgerLevelLabel(r.level) },
  {
    key: "level",
    header: "Rate",
    cell: (r) => <span className="font-mono text-xs text-gold-light">{r.rate}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => <span className="font-mono text-success">{formatINR(r.amount)}</span>,
  },
]

export function AdminIncomeReportsPage() {
  const ledger = useCommissionLedger()
  const [period, setPeriod] = useState<Period>("This month")
  const [view, setView] = useState(VIEW_OPTIONS[0])

  const rows = (ledger.data ?? [])
    .filter((e) => inPeriod(e.date, period))
    .sort((a, b) =>
      view === "Level-wise"
        ? a.level - b.level || b.date.localeCompare(a.date)
        : b.date.localeCompare(a.date),
    )
  const total = rows.reduce((s, e) => s + e.amount, 0)
  const byLevel = SPLIT.map((level) =>
    rows.filter((e) => e.level === level).reduce((s, e) => s + e.amount, 0),
  )
  const maxSplit = Math.max(1, ...byLevel)
  const sales = new Set(rows.map((e) => e.orderId)).size

  const earners = new Map<string, { vedId: string; name: string; amount: number }>()
  for (const e of rows) {
    const cur = earners.get(e.recipient.vedId) ?? { ...e.recipient, amount: 0 }
    cur.amount += e.amount
    earners.set(e.recipient.vedId, cur)
  }
  const topEarners = [...earners.values()].sort((a, b) => b.amount - a.amount).slice(0, 5)

  const exportCsv = () =>
    downloadCsv(
      `vedora-income-${period.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`,
      ["Date", "Order", "Buyer", "Recipient", "Recipient name", "Type", "Rate", "Amount (INR)"],
      rows.map((r) => [
        formatDate(r.date),
        orderNo(r.orderId),
        r.seller.vedId,
        r.recipient.vedId,
        r.recipient.name,
        ledgerLevelLabel(r.level),
        r.rate,
        r.amount,
      ]),
    )

  return (
    <>
      <PageHeader
        title="Income Reports"
        subtitle={`Commission ledger produced by the BV engine · ${period.toLowerCase()}`}
        actions={
          <>
            <FilterSelect
              label="View"
              options={VIEW_OPTIONS}
              defaultValue={view}
              onValueChange={setView}
            />
            <FilterSelect
              label="Period"
              options={[...PERIODS]}
              defaultValue={period}
              onValueChange={(v) => setPeriod(v as Period)}
            />
            <Button onClick={exportCsv} disabled={rows.length === 0}>
              Export
            </Button>
          </>
        }
      />
      <PageBody>
        <QueryState query={ledger} rows={6}>
          <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
            <Panel>
              <PanelHeader
                title="Payout split across the plan"
                aside={<span className="font-mono text-gold">{formatINR(total)} total</span>}
              />
              <ul className="space-y-3.5">
                {SPLIT.map((level, i) => (
                  <li
                    key={level}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[7.5rem_1fr_5.5rem]"
                  >
                    <span
                      className={cn("text-xs", level === 0 ? "text-gold" : "text-muted-foreground")}
                    >
                      {ledgerLevelLabel(level)}
                    </span>
                    <span className="text-right font-mono text-xs sm:order-last">
                      {formatINR(byLevel[i])}
                    </span>
                    <div className="col-span-2 h-3 overflow-hidden rounded-full bg-forest/60 sm:col-span-1">
                      <div
                        className={cn("h-full rounded-full", barTone(level))}
                        style={{ width: `${(byLevel[i] / maxSplit) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <PanelHeader title="Top earners this period" />
              {topEarners.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No commissions yet.
                </p>
              ) : (
                <ol>
                  {topEarners.map((e, i) => (
                    <li
                      key={e.vedId}
                      className="flex items-center gap-4 border-b border-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <span className="font-mono text-xs text-gold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.875rem] font-medium">{e.name}</p>
                        <MonoId tone="muted" className="text-[0.6875rem]">
                          {e.vedId}
                        </MonoId>
                      </div>
                      <span className="font-mono text-[0.8125rem] text-success">
                        {formatINR(e.amount)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>

          <Panel>
            <PanelHeader
              title="Commission ledger"
              aside="Every row is one entry written by the engine — auditable against the sale"
            />
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(r) => r.id}
              emptyMessage="No commission entries in this period."
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
              <span>
                {formatNumber(sales)} paid sale{sales === 1 ? "" : "s"} ·{" "}
                {formatNumber(rows.length)} entries
              </span>
              <span className="font-mono text-sm text-gold">{formatINR(total)}</span>
            </div>
          </Panel>
        </QueryState>
      </PageBody>
    </>
  )
}
