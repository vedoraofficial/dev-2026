import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { withdrawalRequests, type WithdrawalRequest } from "@/features/withdrawals/mock-data"
import { formatINR } from "@/lib/format"

const columns: Column<WithdrawalRequest>[] = [
  {
    key: "request",
    header: "Request",
    primary: true,
    cell: (r) => (
      <MonoId tone="gold" className="text-[0.8125rem]">
        {r.id}
      </MonoId>
    ),
  },
  {
    key: "partner",
    header: "Partner",
    cell: (r) => (
      <div>
        <p className="font-semibold">{r.partner}</p>
        <MonoId tone="muted" className="text-[0.6875rem]">
          {r.partnerId}
        </MonoId>
      </div>
    ),
  },
  {
    key: "bank",
    header: "Bank",
    cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.bank}</span>,
  },
  {
    key: "wallet",
    header: "Wallet bal.",
    cell: (r) => (
      <span className="font-mono text-xs text-muted-foreground">{formatINR(r.walletBalance)}</span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    cell: (r) => <span className="font-mono font-medium">{formatINR(r.amount)}</span>,
  },
  {
    key: "actions",
    header: "Action",
    actions: true,
    cell: () => (
      <>
        <Button size="sm">Approve</Button>
        <Button variant="destructive" size="sm">
          Reject
        </Button>
      </>
    ),
  },
]

export function AdminWithdrawalsPage() {
  return (
    <>
      <PageHeader
        title="Withdrawal Requests"
        subtitle="9 pending · ₹1,84,000 awaiting approval"
        actions={
          <>
            <Input
              type="search"
              placeholder="Search request or ID…"
              aria-label="Search withdrawals"
              className="w-full md:w-64"
            />
            <Button className="max-md:flex-1">Bulk approve</Button>
          </>
        }
      />
      <PageBody>
        <StatGrid cols={5} className="[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
          <StatCard label="Total partners" value="6,482" />
          <StatCard label="Joined today" value="64" />
          <StatCard label="BV this month" value="18.4L" />
          <StatCard label="Commission paid" value="₹11.0L" />
          <StatCard highlight label="Pending payouts" value="₹1.84L" />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Withdrawal status"
              tabs={[
                { value: "pending", label: "Pending 9" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
            <div className="flex items-center gap-2">
              <FilterSelect label="Gateway" options={["All", "Razorpay", "PhonePe"]} />
              <FilterSelect label="Range" options={["Last 7 days", "Last 30 days", "This month"]} />
            </div>
          </div>
          <DataTable columns={columns} rows={withdrawalRequests} getRowKey={(r) => r.id} />
          <TablePagination summary="Showing 5 of 9 pending requests · ₹1,84,000" pages={2} />
        </Panel>
      </PageBody>
    </>
  )
}
