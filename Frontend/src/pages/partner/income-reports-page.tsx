import { useMemo, useState } from "react"

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
import { downloadCsv } from "@/lib/csv"
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

const periodDateLabels: Record<string, string> = {
  "This month": "01 Sep – 18 Sep 2026",
  "Last month": "01 Aug – 31 Aug 2026",
  Custom: "01 Aug – 18 Sep 2026",
}

export function PartnerIncomeReportsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [period, setPeriod] = useState("This month")

  // Filter rows based on the selected tab
  const filteredRows = useMemo(() => {
    if (activeTab === "all") return partnerIncome
    if (activeTab === "capped") {
      return partnerIncome.filter((r) => r.category === "capped" || r.amount === 0 || Boolean(r.flag))
    }
    return partnerIncome.filter((r) => r.category === activeTab)
  }, [activeTab])

  // Earned total displayed in the tab bar
  const displayedEarned = useMemo(() => {
    if (activeTab === "all") {
      return partnerIncomeSummary.reduce((sum, s) => sum + s.amount, 0)
    }
    if (activeTab === "direct") {
      return partnerIncomeSummary.find((s) => s.label === "Direct Sale")?.amount ?? 22000
    }
    if (activeTab === "bv") {
      return partnerIncomeSummary
        .filter((s) => s.label.startsWith("Level"))
        .reduce((sum, s) => sum + s.amount, 0)
    }
    if (activeTab === "activation") {
      return filteredRows.reduce((sum, r) => sum + r.amount, 0)
    }
    return 0
  }, [activeTab, filteredRows])

  const handleDownloadCsv = () => {
    downloadCsv(
      `vedora-partner-income-${activeTab}-${period.toLowerCase().replace(/\s+/g, "-")}.csv`,
      ["Date", "Source Partner", "Income Type", "BV", "Level", "Amount (INR)"],
      filteredRows.map((r) => [
        r.date,
        r.source,
        r.flag ? `${r.type} (${r.flag})` : r.type,
        r.bv,
        r.level,
        r.amount,
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="Income Reports"
        subtitle={periodDateLabels[period] ?? "01 Sep – 18 Sep 2026"}
        actions={
          <>
            <FilterSelect
              label="Period"
              options={["This month", "Last month", "Custom"]}
              defaultValue={period}
              onValueChange={setPeriod}
            />
            <Button variant="outline" onClick={handleDownloadCsv}>
              Download CSV
            </Button>
          </>
        }
      />
      <PageBody>
        <StatGrid cols={6}>
          {partnerIncomeSummary.map((s) => {
            const isDirect = s.label === "Direct Sale"
            const isLevel = s.label.startsWith("Level")
            const isHighlight =
              (activeTab === "direct" && isDirect) ||
              (activeTab === "bv" && isLevel) ||
              (activeTab === "all" && s.highlight)

            return (
              <StatCard
                key={s.label}
                highlight={isHighlight}
                label={s.label}
                value={formatINR(s.amount)}
                hint={s.hint}
                onClick={() => {
                  if (isDirect) {
                    setActiveTab("direct")
                  } else if (isLevel) {
                    setActiveTab("bv")
                  }
                }}
              />
            )
          })}
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              tabs={partnerIncomeTabs}
              value={activeTab}
              onValueChange={setActiveTab}
              aria-label="Income type"
            />
            <span className="font-mono text-xs text-gold">
              {activeTab === "capped"
                ? `₹0 earned · ${filteredRows.length} excluded`
                : `${formatINR(displayedEarned)} earned · ${filteredRows.length} entries`}
            </span>
          </div>
          <DataTable
            columns={columns}
            rows={filteredRows}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (excluded(r) ? "bg-muted/30" : undefined)}
            emptyMessage="No entries found for this income category."
          />
        </Panel>
      </PageBody>
    </>
  )
}

