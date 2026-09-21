import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import {
  partnerIncome,
  partnerIncomeSummary,
  partnerIncomeTabs,
  type PartnerIncomeEntry,
} from "@/features/income/mock-data"
import { formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const excluded = (r: PartnerIncomeEntry) => r.amount === 0

const columns: Column<PartnerIncomeEntry>[] = [
  {
    key: "date",
    header: "Date",
    cell: (r) => <span className="text-muted-foreground">{r.date}</span>,
  },
  {
    key: "source",
    header: "Source partner",
    primary: true,
    cell: (r) => <MonoId className="text-[0.8125rem]">{r.source}</MonoId>,
  },
  {
    key: "type",
    header: "Income type",
    cell: (r) => (
      <span className={excluded(r) ? "text-muted-foreground" : undefined}>
        {r.type}
        {r.flag ? <span className="text-danger"> — {r.flag}</span> : null}
      </span>
    ),
  },
  {
    key: "bv",
    header: "BV",
    cell: (r) => (
      <span className={cn("font-mono text-xs", r.bv === 0 ? "text-gold" : "text-muted-foreground")}>
        {formatNumber(r.bv)}
      </span>
    ),
  },
  {
    key: "level",
    header: "Level",
    cell: (r) => (
      <span
        className={cn(
          "font-mono text-xs",
          excluded(r)
            ? "text-muted-foreground"
            : r.level === "—" || r.level === "No new ID"
              ? "text-muted-foreground"
              : "text-gold-light",
        )}
      >
        {r.level}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => (
      <span className={cn("font-mono", excluded(r) ? "text-danger" : "text-success")}>
        {excluded(r) ? formatINR(0) : `+${formatINR(r.amount)}`}
      </span>
    ),
  },
]

export function PartnerIncomeReportsPage() {
  const total = partnerIncomeSummary.reduce((sum, s) => sum + s.amount, 0)

  return (
    <>
      <PageHeader
        title="Income Reports"
        subtitle="01 Sep – 18 Sep 2026"
        actions={
          <>
            <FilterSelect label="Period" options={["This month", "Last month", "Custom"]} />
            <Button variant="outline">Download CSV</Button>
          </>
        }
      />
      <PageBody>
        <StatGrid cols={6}>
          {partnerIncomeSummary.map((s) => (
            <StatCard
              key={s.label}
              highlight={s.highlight}
              label={s.label}
              value={formatINR(s.amount)}
              hint={s.hint}
            />
          ))}
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs tabs={partnerIncomeTabs} aria-label="Income type" />
            <span className="font-mono text-xs text-gold">{formatINR(total)} earned</span>
          </div>
          <DataTable
            columns={columns}
            rows={partnerIncome}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (excluded(r) ? "bg-muted/30" : undefined)}
          />
        </Panel>
      </PageBody>
    </>
  )
}
