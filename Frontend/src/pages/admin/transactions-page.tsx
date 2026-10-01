import { useState } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { Input } from "@/components/ui/input"
import { transactions, txnStatusPill, type Transaction } from "@/features/transactions/mock-data"
import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "registration", label: "Registration" },
  { value: "purchase", label: "Purchase" },
  { value: "recharge", label: "Recharge" },
  { value: "payout", label: "Payout" },
]
const RANGE_OPTIONS = ["Today", "Last 7 days", "This month"]

function matchesType(t: Transaction, tab: string): boolean {
  if (tab === "all") return true
  return t.touchpoint.toLowerCase().includes(tab)
}

/** "Today" ⊆ "Last 7 days" ⊆ "This month". */
function matchesRange(t: Transaction, range: string): boolean {
  if (range === "Today") return t.when === "today"
  if (range === "Last 7 days") return t.when === "today" || t.when === "week"
  return true
}

function matchesQuery(t: Transaction, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return t.id.toLowerCase().includes(q) || t.partnerId.toLowerCase().includes(q)
}

const columns: Column<Transaction>[] = [
  {
    key: "id",
    header: "Txn ID",
    primary: true,
    cell: (r) => (
      <MonoId tone="gold" className="text-[0.8125rem]">
        {r.id}
      </MonoId>
    ),
  },
  { key: "partner", header: "Partner", cell: (r) => <MonoId>{r.partnerId}</MonoId> },
  { key: "touchpoint", header: "Touchpoint", cell: (r) => r.touchpoint },
  {
    key: "gateway",
    header: "Gateway",
    cell: (r) => <span className="text-muted-foreground">{r.gateway}</span>,
  },
  {
    key: "method",
    header: "Method",
    cell: (r) => <span className="text-muted-foreground">{r.method}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <StatusPill variant={txnStatusPill[r.status].variant}>
        {txnStatusPill[r.status].label}
      </StatusPill>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => (
      <span className={cn("font-mono", r.status === "failed" && "text-muted-foreground")}>
        {formatINR(r.amount)}
      </span>
    ),
  },
]

export function AdminTransactionsPage() {
  const [tab, setTab] = useState("all")
  const [range, setRange] = useState(RANGE_OPTIONS[0])
  const [query, setQuery] = useState("")

  const rows = transactions.filter(
    (t) => matchesType(t, tab) && matchesRange(t, range) && matchesQuery(t, query),
  )

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Registration, purchase, wallet recharge and payout — PhonePe"
        actions={
          <Input
            type="search"
            placeholder="Search txn or partner ID…"
            aria-label="Search transactions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-64"
          />
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard label="Collected today" value="₹2,48,000" />
          <StatCard tone="success" label="Success rate" value="96.2%" />
          <StatCard tone="warning" label="Pending" value="14" />
          <StatCard tone="danger" label="Failed today" value="6" />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Transaction type"
              tabs={TYPE_TABS}
              value={tab}
              onValueChange={setTab}
            />
            <div className="flex items-center gap-2">
              <FilterSelect label="Gateway" options={["PhonePe"]} />
              <FilterSelect
                label="Range"
                options={RANGE_OPTIONS}
                defaultValue={range}
                onValueChange={setRange}
              />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (r.status === "failed" ? "bg-muted/30" : undefined)}
            emptyMessage={
              query.trim() ? `No transactions match "${query.trim()}".` : "No transactions here."
            }
          />
        </Panel>
      </PageBody>
    </>
  )
}
