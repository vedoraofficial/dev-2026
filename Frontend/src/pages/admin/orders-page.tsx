import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import {
  adminOrders,
  deliverySla,
  orderStatusPill,
  orderTabs,
  warrantyClaims,
  type AdminOrder,
} from "@/features/orders/mock-data"
import { formatINR } from "@/lib/format"

function RowActions({ row }: { row: AdminOrder }) {
  switch (row.status) {
    case "delivered":
      return (
        <Button variant="quiet" size="sm">
          Invoice
        </Button>
      )
    case "shipped":
      return (
        <Button variant="quiet" size="sm">
          Track
        </Button>
      )
    case "confirmed":
      return (
        <>
          <Button size="sm">Dispatch</Button>
          <Button variant="destructive" size="sm">
            Cancel
          </Button>
        </>
      )
    case "failed":
      return (
        <Button variant="quiet" size="sm">
          Hold
        </Button>
      )
    case "refunding":
      return <Button size="sm">Approve refund</Button>
  }
}

const columns: Column<AdminOrder>[] = [
  {
    key: "order",
    header: "Order",
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
        <p className="font-medium">{r.partner}</p>
        <MonoId tone="muted" className="text-[0.6875rem]">
          {r.partnerId}
        </MonoId>
      </div>
    ),
  },
  {
    key: "items",
    header: "Items",
    cell: (r) => <span className="text-muted-foreground">{r.items}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    cell: (r) => <span className="font-mono">{formatINR(r.amount)}</span>,
  },
  {
    key: "shipment",
    header: "Shipment",
    cell: (r) => <span className="text-muted-foreground">{r.shipment}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <StatusPill variant={orderStatusPill[r.status].variant}>
        {orderStatusPill[r.status].label}
      </StatusPill>
    ),
  },
  { key: "actions", header: "Action", actions: true, cell: (r) => <RowActions row={r} /> },
]

export function AdminOrdersPage() {
  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Processing within 24–48 business hours of payment · prepaid only"
        actions={<Button>Bulk dispatch</Button>}
      />
      <PageBody>
        <StatGrid cols={5} className="[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
          <StatCard label="Orders today" value="64" hint="₹1.28L collected" />
          <StatCard highlight label="Awaiting dispatch" value="18" hint="Within 24–48 h SLA" />
          <StatCard label="In transit" value="112" />
          <StatCard label="Delivered this month" value="1,642" />
          <StatCard label="Refunds pending" value="3" hint="₹5,997" />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs tabs={orderTabs} aria-label="Order status" />
            <div className="flex items-center gap-2">
              <FilterSelect label="Courier" options={["All", "Blue Dart", "Delhivery"]} />
              <FilterSelect label="Range" options={["Today", "Last 7 days", "This month"]} />
            </div>
          </div>
          <DataTable columns={columns} rows={adminOrders} getRowKey={(r) => r.id} />
          <TablePagination
            summary="Showing 5 of 64 orders today · prepaid only, no COD"
            pages={2}
          />
        </Panel>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
          <Panel>
            <PanelHeader title="Delivery SLA by zone" />
            <ul>
              {deliverySla.map((z) => (
                <li
                  key={z.zone}
                  className="flex items-center justify-between gap-3 border-b border-border/70 py-3 text-[0.8125rem] first:pt-0 last:border-b-0"
                >
                  <span className="text-foreground/85">{z.zone}</span>
                  <span className="text-right text-xs font-medium text-gold-light">{z.sla}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.6875rem] text-muted-foreground">
              Up to 3 delivery attempts before return to warehouse
            </p>
          </Panel>

          <Panel>
            <PanelHeader title="Warranty claims" />
            <ul className="space-y-4">
              {warrantyClaims.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <div>
                    <MonoId tone="gold">{c.id}</MonoId>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      <MonoId tone="muted" className="text-[0.6875rem]">
                        {c.partnerId}
                      </MonoId>{" "}
                      · {c.issue}
                    </p>
                  </div>
                  <StatusPill variant={c.variant}>{c.status}</StatusPill>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.6875rem] text-muted-foreground">
              7-day window from delivery · photo or video proof required
            </p>
          </Panel>

          <Panel>
            <p className="mb-3 eyebrow text-gold">Cancellation rules</p>
            <div className="space-y-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
              <p>
                Partners can cancel only before dispatch. After dispatch the order moves to the
                return route. Prepaid refunds settle to the original method within 7–10 business
                days.
              </p>
              <p>
                Admin may cancel for stock unavailability, payment verification failure, incomplete
                address or suspected fraud — prepaid customers are refunded in full.
              </p>
            </div>
          </Panel>
        </div>
      </PageBody>
    </>
  )
}
