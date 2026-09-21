import { DataTable, type Column } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { Timeline } from "@/components/common/timeline"
import { Button } from "@/components/ui/button"
import {
  orderStatusPill,
  orderTabs,
  partnerOrders,
  shipmentTimeline,
  type PartnerOrder,
} from "@/features/orders/mock-data"
import { formatINR } from "@/lib/format"

function RowAction({ row }: { row: PartnerOrder }) {
  switch (row.status) {
    case "delivered":
      return (
        <Button variant="outline" size="sm">
          Claim warranty
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
        <Button variant="destructive" size="sm">
          Cancel
        </Button>
      )
    case "failed":
      return <Button size="sm">Retry payment</Button>
    default:
      return null
  }
}

const columns: Column<PartnerOrder>[] = [
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
    key: "product",
    header: "Product",
    cell: (r) => (
      <div>
        <p className="font-medium">{r.product}</p>
        <p className="text-[0.6875rem] text-muted-foreground">{r.date}</p>
      </div>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    cell: (r) => <span className="font-mono">{formatINR(r.amount)}</span>,
  },
  {
    key: "delivery",
    header: "Delivery",
    cell: (r) => <span className="text-muted-foreground">{r.delivery}</span>,
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
  { key: "action", header: "Action", actions: true, cell: (r) => <RowAction row={r} /> },
]

export function PartnerOrdersPage() {
  return (
    <>
      <PageHeader
        title="My Orders"
        subtitle="Prepaid orders only · cancel before dispatch"
        actions={<Button>Place new order</Button>}
      />
      <PageBody>
        <StatGrid>
          <StatCard label="Total orders" value="38" hint="Since Mar 2026" />
          <StatCard label="Units sold" value="110" hint="220 SRP earned" />
          <StatCard label="In transit" value="1" hint="BD1247891" />
          <StatCard
            highlight
            label="Warranty window"
            value="2 orders"
            hint="7 days from delivery"
          />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <FilterTabs
              tabs={orderTabs.filter((t) => t.value !== "refunds")}
              aria-label="Order status"
            />
            <p className="text-[0.6875rem] text-muted-foreground">
              Orders can be cancelled only before dispatch
            </p>
          </div>
          <DataTable columns={columns} rows={partnerOrders} getRowKey={(r) => r.id} />
        </Panel>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader title="Shipment tracking — ORD-01198" />
            <Timeline steps={shipmentTimeline} />
          </Panel>

          <Panel className="flex flex-col">
            <p className="mb-3 eyebrow text-gold">Warranty &amp; reporting</p>
            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                7-day manufacturing defect warranty from delivery. Damaged or tampered packages must
                be reported within 48 hours with photos and an unboxing video.
              </p>
              <p>
                Not covered: normal wear and tear, water or chemical damage, elastic broken by
                improper handling, physical damage after delivery.
              </p>
            </div>
            <Button size="lg" className="mt-5 w-full lg:mt-auto">
              Raise warranty claim
            </Button>
          </Panel>
        </div>
      </PageBody>
    </>
  )
}
