import { useState } from "react"
import { toast } from "sonner"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { getSalesRegister } from "@/features/orders/api"
import { orderNo, paymentMethodLabel } from "@/features/orders/labels"
import { useAllOrders } from "@/features/orders/queries"
import { maskedBank } from "@/features/wallet/labels"
import { useAllWithdrawals } from "@/features/wallet/queries"
import type { SalesRegisterRow } from "@/features/orders/types"
import { apiErrorMessage } from "@/lib/api"
import { combineQueries } from "@/lib/combine-queries"
import { downloadCsv } from "@/lib/csv"
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
const RANGE_OPTIONS = [
  "Today",
  "Last 7 days",
  "This month",
  "Last month",
  "This financial year",
  "All time",
]

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()

/** First day of the Indian financial year (1 April) that `now` falls in. */
const financialYearStart = (now: Date) =>
  new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1)

function matchesRange(iso: string, range: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  if (range === "Today") return isToday(iso)
  if (range === "Last 7 days") return now.getTime() - d.getTime() <= 7 * 864e5
  if (range === "This month")
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  if (range === "Last month") {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getFullYear() === last.getFullYear() && d.getMonth() === last.getMonth()
  }
  if (range === "This financial year") return d >= financialYearStart(now)
  return true
}

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/** The same range as whole days (YYYY-MM-DD, both included) — for the sales register API. */
function rangeDays(range: string): { from: string; to: string } {
  const now = new Date()
  const today = isoDay(now)
  switch (range) {
    case "Today":
      return { from: today, to: today }
    case "Last 7 days":
      return { from: isoDay(new Date(now.getTime() - 7 * 864e5)), to: today }
    case "This month":
      return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
    case "Last month":
      return {
        from: isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: isoDay(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
    case "This financial year":
      return { from: isoDay(financialYearStart(now)), to: today }
    default:
      return { from: "2000-01-01", to: today }
  }
}

// ─── CSV for the CA: plain numbers (so Excel can add them up) and DD-MM-YYYY dates ───

const csvAmount = (paise: number) => (Number(paise) / 100).toFixed(2)
const csvDate = (iso: string | null | undefined) => {
  if (!iso) return ""
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`
}
const fileSlug = (range: string) => range.toLowerCase().replace(/\s+/g, "-")

const WITHDRAWAL_STATUS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  COMPLETED: "Paid",
  REJECTED: "Rejected",
  REVERSED: "Reversed",
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
  // Everything by default — narrow it with the Range filter
  const [range, setRange] = useState("All time")
  const [query, setQuery] = useState("")
  const [exporting, setExporting] = useState(false)

  const txns: Txn[] = [
    ...(orders.data ?? []).map((o): Txn => ({
      id: orderNo(o.id),
      date: o.createdAt,
      partnerId: o.user?.vedId ?? "—",
      partnerName: o.user?.name ?? "",
      touchpoint: "Purchase",
      gateway: o.paymentMethod === "RAZORPAY" ? "Razorpay" : paymentMethodLabel[o.paymentMethod],
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

  /** Sales register (GST) for the CA — built by the backend with the invoices' GST split. */
  const exportSalesRegister = async () => {
    setExporting(true)
    try {
      const { from, to } = rangeDays(range)
      const sales = await getSalesRegister(from, to)
      if (!sales.length) {
        toast.info("No paid sales in this range.")
        return
      }
      const sum = (pick: (r: SalesRegisterRow) => number) => sales.reduce((s, r) => s + pick(r), 0)
      downloadCsv(
        `vedora-sales-register-${fileSlug(range)}.csv`,
        [
          "Invoice date",
          "Invoice no",
          "Order no",
          "Order date",
          "Customer name",
          "VEDORA ID",
          "Place of supply",
          "Product",
          "HSN",
          "Qty",
          "Unit price (incl. GST)",
          "Taxable value",
          "GST %",
          "CGST",
          "SGST",
          "IGST",
          "Total (incl. GST)",
          "Payment method",
          "Payment reference",
          "Payment status",
          "Order status",
        ],
        [
          ...sales.map((r) => [
            csvDate(r.invoiceDate),
            r.invoiceNumber ?? "",
            orderNo(r.orderId),
            csvDate(r.orderDate),
            r.customerName,
            r.vedId,
            r.placeOfSupply,
            r.product,
            r.hsn,
            r.quantity,
            csvAmount(r.unitPrice),
            csvAmount(r.taxableValue),
            r.gstRate,
            csvAmount(r.cgst),
            csvAmount(r.sgst),
            csvAmount(r.igst),
            csvAmount(r.total),
            paymentMethodLabel[r.paymentMethod] ?? r.paymentMethod,
            r.paymentReference ?? "",
            r.paymentStatus === "REFUNDED" ? "Refunded" : "Paid",
            r.orderStatus,
          ]),
          [
            "TOTAL",
            "",
            `${sales.length} orders`,
            "",
            "",
            "",
            "",
            "",
            "",
            sum((r) => r.quantity),
            "",
            csvAmount(sum((r) => r.taxableValue)),
            "",
            csvAmount(sum((r) => r.cgst)),
            csvAmount(sum((r) => r.sgst)),
            csvAmount(sum((r) => r.igst)),
            csvAmount(sum((r) => r.total)),
            "",
            "",
            "",
            "",
          ],
        ],
      )
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't prepare the sales register. Try again."))
    } finally {
      setExporting(false)
    }
  }

  /** Payouts register for the CA — every withdrawal requested in the range. */
  const exportPayoutsRegister = () => {
    const payouts = (withdrawals.data ?? [])
      .filter((w) => matchesRange(w.createdAt, range))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    if (!payouts.length) {
      toast.info("No withdrawals in this range.")
      return
    }
    const paid = payouts.filter((w) => w.status === "APPROVED" || w.status === "COMPLETED")
    downloadCsv(
      `vedora-payouts-register-${fileSlug(range)}.csv`,
      [
        "Request date",
        "Withdrawal no",
        "Partner name",
        "VEDORA ID",
        "Bank",
        "IFSC",
        "Account (last 4)",
        "Amount",
        "Status",
        "Processed date",
        "Remarks / UTR",
      ],
      [
        ...payouts.map((w) => [
          csvDate(w.createdAt),
          `WD-${String(w.id).padStart(5, "0")}`,
          w.user.name,
          w.user.vedId,
          w.bank?.bankName ?? "",
          w.bank?.ifscCode ?? "",
          w.bank ? `XXXX${w.bank.accountNumber.slice(-4)}` : "",
          csvAmount(w.amount),
          WITHDRAWAL_STATUS[w.status] ?? w.status,
          csvDate(w.processedAt),
          w.adminRemarks ?? "",
        ]),
        [
          "TOTAL PAID",
          `${paid.length} payouts`,
          "",
          "",
          "",
          "",
          "",
          csvAmount(paid.reduce((s, w) => s + Number(w.amount), 0)),
          "",
          "",
          "",
        ],
      ],
    )
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Purchases (Razorpay · cash) and withdrawal payouts"
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
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Range"
                options={RANGE_OPTIONS}
                defaultValue={range}
                onValueChange={setRange}
              />
              {/* CSV files (open in Excel) for the selected range */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 md:h-9" disabled={exporting}>
                    {exporting ? "Preparing…" : "Export CSV"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem onSelect={() => void exportSalesRegister()}>
                    Sales register (GST)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={exportPayoutsRegister}>
                    Payouts register
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
