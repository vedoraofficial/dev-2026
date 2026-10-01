import { useState } from "react"
import { toast } from "sonner"

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
  partnerOrders,
  partnerOrderStats,
  shipmentTimeline,
  type OrderStatus,
  type PartnerOrder,
} from "@/features/orders/mock-data"
import { formatINR } from "@/lib/format"

const TABS = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunding", label: "Refunding" },
  { value: "failed", label: "Failed" },
]

/** "Cancelled" also keeps cancelled orders whose refund is already done. */
const CANCELLED: OrderStatus[] = ["cancelled", "refunded"]

function matchesTab(order: PartnerOrder, tab: string): boolean {
  if (tab === "all") return true
  if (tab === "cancelled") return CANCELLED.includes(order.status)
  return order.status === tab
}

function RowAction({ row, onCancel }: { row: PartnerOrder; onCancel: () => void }) {
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
        <Button variant="destructive" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )
    case "failed":
      return <Button size="sm">Retry payment</Button>
    default:
      return null
  }
}

const baseColumns: Column<PartnerOrder>[] = [
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
]

export function PartnerOrdersPage() {
  // DUMMY: orders live in page state so "Cancel" can move one to the Cancelled tab.
  const [orders, setOrders] = useState(partnerOrders)
  const [tab, setTab] = useState(TABS[0].value)

  const rows = orders.filter((o) => matchesTab(o, tab))
  const stats = partnerOrderStats(orders)
  const tabs = TABS.map((t) => ({
    ...t,
    label: `${t.label} ${orders.filter((o) => matchesTab(o, t.value)).length}`,
  }))

  const cancelOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: "refunding", delivery: "Cancelled by you · refund in 7–10 days" }
          : o,
      ),
    )
    toast.success(`${id} cancelled — refund in 7–10 business days`)
  }

  const columns: Column<PartnerOrder>[] = [
    ...baseColumns,
    {
      key: "action",
      header: "Action",
      actions: true,
      cell: (r) => <RowAction row={r} onCancel={() => cancelOrder(r.id)} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="My Orders"
        subtitle="Prepaid orders only · cancel before dispatch"
        actions={<Button>Place new order</Button>}
      />
      <PageBody>
        <StatGrid>
          <StatCard
            label="Total orders"
            value={stats.totalOrders}
            hint={`Since ${stats.since}`}
            highlight={tab === "all"}
            pressed={tab === "all"}
            onClick={() => setTab("all")}
          />
          <StatCard
            label="Refunding"
            value={stats.refunding.count}
            hint={
              stats.refunding.count
                ? `${formatINR(stats.refunding.amount)} on the way back`
                : "No refunds pending"
            }
            highlight={tab === "refunding"}
            pressed={tab === "refunding"}
            onClick={() => setTab("refunding")}
          />
          <StatCard
            label="In transit"
            value={stats.inTransit}
            hint={stats.trackingIds.join(" · ") || "Nothing on the way"}
            highlight={tab === "shipped"}
            pressed={tab === "shipped"}
            onClick={() => setTab("shipped")}
          />
          <StatCard
            label="Failed"
            tone={stats.failed.count ? "danger" : undefined}
            value={stats.failed.count}
            hint={
              stats.failed.count
                ? `${formatINR(stats.failed.amount)} not paid · retry payment`
                : "All payments went through"
            }
            highlight={tab === "failed"}
            pressed={tab === "failed"}
            onClick={() => setTab("failed")}
          />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <FilterTabs tabs={tabs} value={tab} onValueChange={setTab} aria-label="Order status" />
            <p className="text-[0.6875rem] text-muted-foreground">
              Orders can be cancelled only before dispatch
            </p>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            emptyMessage="No orders here."
          />
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
