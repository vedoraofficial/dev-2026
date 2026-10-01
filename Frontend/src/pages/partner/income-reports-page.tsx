import { useState } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import { categoryLabel } from "@/features/wallet/labels"
import { useCommissionIncome } from "@/features/wallet/queries"
import type { WalletTransaction } from "@/features/wallet/types"
import { downloadCsv } from "@/lib/csv"
import { formatDate, formatDateTime, startOfMonth } from "@/lib/date"
import { formatINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

const PERIODS = ["This month", "Last month", "All time"] as const
type Period = (typeof PERIODS)[number]

/** Date range for the backend's fromDate / toDate filters. */
function rangeFor(period: Period): { fromDate?: string; toDate?: string } {
  if (period === "All time") return {}
  const now = new Date()
  if (period === "This month") return { fromDate: startOfMonth(now) }
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { fromDate: startOfMonth(lastMonth), toDate: startOfMonth(now) }
}

const TABS = [
  { value: "all", label: "All Income" },
  { value: "direct", label: "Direct Sale" },
  { value: "bv", label: "BV Level" },
]

const columns: Column<WalletTransaction>[] = [
  {
    key: "date",
    header: "Date",
    cell: (r) => <span className="text-muted-foreground">{formatDateTime(r.createdAt)}</span>,
  },
  {
    key: "type",
    header: "Income type",
    primary: true,
    cell: (r) => <span className="font-medium">{categoryLabel[r.category]}</span>,
  },
  {
    key: "source",
    header: "From",
    cell: (r) =>
      r.referenceType === "ORDER" && r.referenceId ? (
        <MonoId className="text-[0.8125rem]">Order #{r.referenceId}</MonoId>
      ) : (
        <span className="text-muted-foreground">{r.description ?? "—"}</span>
      ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => (
      <span className="font-mono text-success">+{formatINR(paiseToRupees(r.amount))}</span>
    ),
  },
]

export function PartnerIncomeReportsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [period, setPeriod] = useState<Period>("This month")
  const range = rangeFor(period)
  const income = useCommissionIncome(range)

  const all = income.data?.commissions ?? []
  const rows = all.filter((r) =>
    activeTab === "direct"
      ? r.category === "COMMISSION_DIRECT"
      : activeTab === "bv"
        ? r.category !== "COMMISSION_DIRECT"
        : true,
  )
  const earned = rows.reduce((sum, r) => sum + paiseToRupees(r.amount), 0)
  const levels = income.data?.levels ?? [0, 0, 0, 0, 0]

  const handleDownloadCsv = () => {
    downloadCsv(
      `vedora-partner-income-${activeTab}-${period.toLowerCase().replace(/\s+/g, "-")}.csv`,
      ["Date", "Income Type", "Reference", "Description", "Amount (INR)"],
      rows.map((r) => [
        formatDate(r.createdAt),
        categoryLabel[r.category],
        r.referenceId ? `${r.referenceType ?? ""} ${r.referenceId}`.trim() : "",
        r.description ?? "",
        paiseToRupees(r.amount),
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="Income Reports"
        subtitle={
          range.fromDate
            ? `${formatDate(range.fromDate)} – ${range.toDate ? formatDate(new Date(new Date(range.toDate).getTime() - 864e5).toISOString()) : "today"}`
            : "All commissions since you joined"
        }
        actions={
          <>
            <FilterSelect
              label="Period"
              options={[...PERIODS]}
              defaultValue={period}
              onValueChange={(v) => setPeriod(v as Period)}
            />
            <Button variant="outline" onClick={handleDownloadCsv} disabled={rows.length === 0}>
              Download CSV
            </Button>
          </>
        }
      />
      <PageBody>
        <StatGrid cols={6}>
          <StatCard
            highlight={activeTab === "direct" || activeTab === "all"}
            label="Direct Sale"
            value={formatINR(income.data?.direct ?? 0)}
            hint="₹200 per unit your direct team buys"
            onClick={() => setActiveTab("direct")}
          />
          {levels.map((amount, i) => (
            <StatCard
              key={i}
              highlight={activeTab === "bv"}
              label={`Level ${i + 1}`}
              value={formatINR(amount)}
              hint={`${i < 3 ? 10 : 5}% of BV`}
              onClick={() => setActiveTab("bv")}
            />
          ))}
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              tabs={TABS}
              value={activeTab}
              onValueChange={setActiveTab}
              aria-label="Income type"
            />
            <span className="font-mono text-xs text-gold">
              {formatINR(earned)} earned · {rows.length} entries
            </span>
          </div>
          <QueryState query={income} rows={5}>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(r) => r.id}
              emptyMessage="No commissions in this period yet."
            />
          </QueryState>
        </Panel>
      </PageBody>
    </>
  )
}
