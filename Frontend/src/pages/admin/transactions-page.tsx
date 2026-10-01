import { useState } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { Input } from "@/components/ui/input"
import { orderNo, paymentMethodLabel } from "@/features/orders/labels"
import { useAllOrders } from "@/features/orders/queries"
import { maskedBank } from "@/features/wallet/labels"
import { useAllWithdrawals } from "@/features/wallet/queries"
import { combineQueries } from "@/lib/combine-queries"
import { formatDateTime } from "@/lib/date"
import { formatINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"
import { cn } from "@/lib/utils"

type TxnStatus = "success" | "pending" | "failed"

/** Money in (orders) and money out (withdrawals) in one list. Amount in rupees. */
type Txn = {
  id: string
  date: string
  partnerId: string
  partnerName: string
  touchpoint: "Purchase" | "Payout"
  gateway: string
  method: string
  status: TxnStatus
  amount: number
}

const statusPill: Record<TxnStatus, { label: string; variant: PillVariant }> = {
  success: { label: "Success", variant: "success" },
  pending: { label: "Pending", variant: "pending" },
  failed: { label: "Failed", variant: "danger" },
}

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "Purchase", label: "Purchase" },
  { value: "Payout", label: "Payout" },
]
const RANGE_OPTIONS = ["Today", "Last 7 days", "This month", "All time"]

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()

function matchesRange(iso: string, range: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  if (range === "Today") return isToday(iso)
  if (range === "Last 7 days") return now.getTime() - d.getTime() <= 7 * 864e5
  if (range === "This month")
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  return true
}

function matchesQuery(t: Txn, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    t.id.toLowerCase().includes(q) ||
    t.partnerId.toLowerCase().includes(q) ||
    t.partnerName.toLowerCase().includes(q)
  )
}

const columns: Column<Txn>[] = [
  {
    key: "id",
    header: "Txn ID",
    primary: true,
    cell: (r) => (
      <div>
        <MonoId tone="gold" className="text-[0.8125rem]">
          {r.id}
        </MonoId>
        <p className="text-[0.6875rem] text-muted-foreground">{formatDateTime(r.date)}</p>
      </div>
    ),
  },
  {
    key: "partner",
    header: "Partner",
    cell: (r) => (
      <div>
        <MonoId>{r.partnerId}</MonoId>
        <p className="text-[0.6875rem] text-muted-foreground">{r.partnerName}</p>
      </div>
    ),
  },
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
      <StatusPill variant={statusPill[r.status].variant}>{statusPill[r.status].label}</StatusPill>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => (
      <span
        className={cn(
          "font-mono",
          r.status === "failed" && "text-muted-foreground",
          r.touchpoint === "Payout" && r.status !== "failed" && "text-gold-light",
        )}
      >
        {r.touchpoint === "Payout" ? "-" : ""}
        {formatINR(r.amount)}
      </span>
    ),
  },
]

export function AdminTransactionsPage() {
  const orders = useAllOrders()
  const withdrawals = useAllWithdrawals()
  const [tab, setTab] = useState("all")
  const [range, setRange] = useState(RANGE_OPTIONS[0])
  const [query, setQuery] = useState("")

  const txns: Txn[] = [
    ...(orders.data ?? []).map((o): Txn => ({
      id: orderNo(o.id),
      date: o.createdAt,
      partnerId: o.user?.vedId ?? "—",
      partnerName: o.user?.name ?? "",
      touchpoint: "Purchase",
      gateway: o.paymentMethod === "PHONEPE" ? "PhonePe" : paymentMethodLabel[o.paymentMethod],
      method: `${o.product.name} × ${o.quantity}`,
      status:
        o.paymentStatus === "PAID" || o.paymentStatus === "REFUNDED"
          ? "success"
          : o.paymentStatus === "FAILED"
            ? "failed"
            : "pending",
      amount: paiseToRupees(o.totalAmount),
    })),
    ...(withdrawals.data ?? []).map((w): Txn => ({
      id: `WD-${String(w.id).padStart(5, "0")}`,
      date: w.createdAt,
      partnerId: w.user.vedId,
      partnerName: w.user.name,
      touchpoint: "Payout",
      gateway: "Bank transfer",
      method: maskedBank(w.bank),
      status: w.status === "REJECTED" ? "failed" : w.status === "PENDING" ? "pending" : "success",
      amount: paiseToRupees(w.amount),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const rows = txns.filter(
    (t) =>
      (tab === "all" || t.touchpoint === tab) &&
      matchesRange(t.date, range) &&
      matchesQuery(t, query),
  )

  const purchases = txns.filter((t) => t.touchpoint === "Purchase")
  const collectedToday = purchases
    .filter((t) => t.status === "success" && isToday(t.date))
    .reduce((s, t) => s + t.amount, 0)
  const settled = purchases.filter((t) => t.status !== "pending")
  const successRate = settled.length
    ? `${((settled.filter((t) => t.status === "success").length / settled.length) * 100).toFixed(1)}%`
    : "—"
  const pending = txns.filter((t) => t.status === "pending").length
  const failedToday = txns.filter((t) => t.status === "failed" && isToday(t.date)).length

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Purchases (PhonePe · cash) and withdrawal payouts"
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
          <StatCard label="Collected today" value={formatINR(collectedToday)} />
          <StatCard
            tone="success"
            label="Success rate"
            value={successRate}
            hint="Settled purchases"
          />
          <StatCard tone="warning" label="Pending" value={pending} />
          <StatCard tone="danger" label="Failed today" value={failedToday} />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Transaction type"
              tabs={TYPE_TABS}
              value={tab}
              onValueChange={setTab}
            />
            <FilterSelect
              label="Range"
              options={RANGE_OPTIONS}
              defaultValue={range}
              onValueChange={setRange}
            />
          </div>
          <QueryState query={combineQueries(orders, withdrawals)} rows={6}>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(r) => r.id}
              rowClassName={(r) => (r.status === "failed" ? "bg-muted/30" : undefined)}
              emptyMessage={
                query.trim()
                  ? `No transactions match "${query.trim()}".`
                  : "No transactions in this range."
              }
            />
          </QueryState>
        </Panel>
      </PageBody>
    </>
  )
}
