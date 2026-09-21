import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import {
  commissionLedger,
  payoutSplit,
  payoutTotal,
  topEarners,
  type LedgerEntry,
} from "@/features/income/mock-data"
import { formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const maxSplit = Math.max(...payoutSplit.map((p) => p.amount))
const barTone = { direct: "bg-gold", mid: "bg-chart-2", low: "bg-chart-4" } as const

const columns: Column<LedgerEntry>[] = [
  {
    key: "date",
    header: "Date",
    cell: (r) => <span className="text-muted-foreground">{r.date}</span>,
  },
  {
    key: "order",
    header: "Order",
    primary: true,
    cell: (r) => (
      <MonoId tone="gold" className="text-[0.8125rem]">
        {r.order}
      </MonoId>
    ),
  },
  { key: "seller", header: "Seller", cell: (r) => <MonoId>{r.seller}</MonoId> },
  { key: "recipient", header: "Recipient", cell: (r) => <MonoId>{r.recipient}</MonoId> },
  {
    key: "type",
    header: "Type",
    cell: (r) => <span className={r.excluded ? "text-muted-foreground" : undefined}>{r.type}</span>,
  },
  {
    key: "level",
    header: "Level",
    cell: (r) => (
      <span className={cn("font-mono text-xs", r.excluded ? "text-danger/80" : "text-gold-light")}>
        {r.level}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => (
      <span className={cn("font-mono", r.excluded ? "text-danger" : "text-success")}>
        {formatINR(r.amount)}
      </span>
    ),
  },
]

export function AdminIncomeReportsPage() {
  return (
    <>
      <PageHeader
        title="Income Reports"
        subtitle="Commission ledger produced by the BV engine · 01–18 Sep 2026"
        actions={
          <>
            <FilterSelect label="View" options={["Level-wise", "Date-wise", "Partner-wise"]} />
            <FilterSelect label="Period" options={["01–18 Sep", "Last month", "Custom"]} />
            <Button>Export</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              title="Payout split across the plan"
              aside={<span className="font-mono text-gold">{formatINR(payoutTotal)} total</span>}
            />
            <ul className="space-y-3.5">
              {payoutSplit.map((row) => (
                <li
                  key={row.label}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[7.5rem_1fr_5.5rem]"
                >
                  <span
                    className={cn(
                      "text-xs",
                      row.tone === "direct" ? "text-gold" : "text-muted-foreground",
                    )}
                  >
                    {row.label}
                  </span>
                  <span className="text-right font-mono text-xs sm:order-last">
                    {formatINR(row.amount)}
                  </span>
                  <div className="col-span-2 h-3 overflow-hidden rounded-full bg-forest/60 sm:col-span-1">
                    <div
                      className={cn("h-full rounded-full", barTone[row.tone])}
                      style={{ width: `${(row.amount / maxSplit) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Top earners this period" />
            <ol>
              {topEarners.map((e, i) => (
                <li
                  key={e.id}
                  className="flex items-center gap-4 border-b border-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <span className="font-mono text-xs text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.875rem] font-semibold">{e.name}</p>
                    <MonoId tone="muted" className="text-[0.6875rem]">
                      {e.id}
                    </MonoId>
                  </div>
                  <span className="font-mono text-[0.8125rem] text-success">
                    {formatINR(e.amount)}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <Panel>
          <PanelHeader
            title="Commission ledger"
            aside="Every row is one entry written by the engine — auditable against the sale"
          />
          <DataTable
            columns={columns}
            rows={commissionLedger}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (r.excluded ? "bg-muted/30 text-muted-foreground" : undefined)}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
            <span>₹600 distributed per sale · {formatNumber(1840)} sales this period</span>
            <span className="font-mono text-sm text-gold">{formatINR(payoutTotal)}</span>
          </div>
        </Panel>
      </PageBody>
    </>
  )
}
