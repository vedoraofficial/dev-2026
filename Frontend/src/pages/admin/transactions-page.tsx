import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { transactions, txnStatusPill, type Transaction } from "@/features/transactions/mock-data"
import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"

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
  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Registration, purchase, wallet recharge and payout — all gateways"
        actions={
          <>
            <Input
              type="search"
              placeholder="Search txn or partner ID…"
              aria-label="Search transactions"
              className="w-full md:w-64"
            />
            <Button variant="outline" className="max-md:flex-1">
              Reconcile
            </Button>
          </>
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
              tabs={[
                { value: "all", label: "All" },
                { value: "registration", label: "Registration" },
                { value: "purchase", label: "Purchase" },
                { value: "recharge", label: "Recharge" },
                { value: "payout", label: "Payout" },
              ]}
            />
            <div className="flex items-center gap-2">
              <FilterSelect label="Gateway" options={["Razorpay", "PhonePe", "All"]} />
              <FilterSelect label="Range" options={["Today", "Last 7 days", "This month"]} />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={transactions}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (r.status === "failed" ? "bg-muted/30" : undefined)}
          />
          <p className="mt-5 rounded-xl border border-border bg-field/60 p-3.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
            Gateway selection is still open — integration is built for Razorpay and PhonePe, the two
            gateways named in Annexure A, so VEDORA can switch based on settlement terms for
            direct-selling merchants.
          </p>
        </Panel>
      </PageBody>
    </>
  )
}
