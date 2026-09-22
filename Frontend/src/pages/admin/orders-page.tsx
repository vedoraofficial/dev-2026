import { useState } from "react"
import { toast } from "sonner"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
import { Timeline } from "@/components/common/timeline"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  adminOrders as initialOrders,
  deliverySla,
  orderStatusPill,
  orderTabs,
  shipmentTimeline,
  warrantyClaims,
  type AdminOrder,
} from "@/features/orders/mock-data"
import { downloadTextFile } from "@/lib/download"
import { formatINR } from "@/lib/format"

/** "refunds" and "all" aren't OrderStatus values — map the tab to what it should match. */
function matchesTab(order: AdminOrder, tab: string): boolean {
  if (tab === "all") return true
  if (tab === "refunds") return order.status === "refunding"
  return order.status === tab
}

function TrackOrderDialog({ row }: { row: AdminOrder }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="quiet" size="sm">
          Track
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Track {row.id}</DialogTitle>
          <DialogDescription>
            {row.partner} · <MonoId tone="muted">{row.partnerId}</MonoId> · {row.shipment}
          </DialogDescription>
        </DialogHeader>
        <Timeline steps={shipmentTimeline} />
      </DialogContent>
    </Dialog>
  )
}

function InvoiceDialog({ row }: { row: AdminOrder }) {
  const downloadInvoice = () => {
    const lines = [
      "VEDORA — Tax Invoice",
      `Order: ${row.id}`,
      `Partner: ${row.partner} (${row.partnerId})`,
      `Items: ${row.items}`,
      `Amount: ${formatINR(row.amount)} (GST inclusive)`,
      `Status: ${orderStatusPill[row.status].label}`,
      `Shipment: ${row.shipment}`,
    ]
    downloadTextFile(`${row.id}-invoice.txt`, lines.join("\n"))
    toast.success(`Invoice downloaded for ${row.id}`)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="quiet" size="sm">
          Invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invoice — {row.id}</DialogTitle>
          <DialogDescription>
            {row.partner} · <MonoId tone="muted">{row.partnerId}</MonoId>
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-3 text-[0.8125rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Items</dt>
            <dd className="text-right font-medium">{row.items}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Amount (GST incl.)</dt>
            <dd className="text-right font-mono font-medium">{formatINR(row.amount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <StatusPill variant={orderStatusPill[row.status].variant}>
                {orderStatusPill[row.status].label}
              </StatusPill>
            </dd>
          </div>
        </dl>
        <DialogFooter>
          <Button onClick={downloadInvoice}>Download invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RowActions({
  row,
  held,
  onDispatch,
  onCancel,
  onHold,
  onApproveRefund,
}: {
  row: AdminOrder
  held: boolean
  onDispatch: () => void
  onCancel: () => void
  onHold: () => void
  onApproveRefund: () => void
}) {
  switch (row.status) {
    case "delivered":
      return <InvoiceDialog row={row} />
    case "shipped":
      return <TrackOrderDialog row={row} />
    case "confirmed":
      return (
        <>
          <Button
            size="sm"
            onClick={() => {
              onDispatch()
              toast.success(`${row.id} dispatched`)
            }}
          >
            Dispatch
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onCancel()
              toast.success(`${row.id} cancelled`)
            }}
          >
            Cancel
          </Button>
        </>
      )
    case "failed":
      return (
        <Button
          variant="quiet"
          size="sm"
          disabled={held}
          onClick={() => {
            onHold()
            toast.success(`${row.id} held for review`)
          }}
        >
          {held ? "On hold" : "Hold"}
        </Button>
      )
    case "refunding":
      return (
        <Button
          size="sm"
          onClick={() => {
            onApproveRefund()
            toast.success(`Refund approved for ${row.id}`)
          }}
        >
          Approve refund
        </Button>
      )
    default:
      return null
  }
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState(initialOrders)
  const [heldIds, setHeldIds] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<string>(orderTabs[0].value)

  const rows = orders.filter((o) => matchesTab(o, tab))

  const updateStatus = (id: string, status: AdminOrder["status"], shipment?: string) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, ...(shipment ? { shipment } : {}) } : o)),
    )

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
    {
      key: "actions",
      header: "Action",
      actions: true,
      cell: (r) => (
        <RowActions
          row={r}
          held={heldIds.has(r.id)}
          onDispatch={() => updateStatus(r.id, "shipped", "Dispatched · awaiting courier scan")}
          onCancel={() => updateStatus(r.id, "cancelled", "Cancelled by admin — pre-dispatch")}
          onHold={() => setHeldIds((prev) => new Set(prev).add(r.id))}
          onApproveRefund={() => updateStatus(r.id, "refunded", "Refund approved and processed")}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Processing within 24–48 business hours of payment · prepaid only"
      />
      <PageBody>
        <StatGrid cols={5} className="[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
          <StatCard label="Orders today" value="64" hint="₹1.28L collected" />
          <StatCard label="Awaiting dispatch" value="18" hint="Within 24–48 h SLA" />
          <StatCard label="In transit" value="112" />
          <StatCard label="Delivered this month" value="1,642" />
          <StatCard label="Refunds pending" value="3" hint="₹5,997" />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              tabs={orderTabs}
              value={tab}
              onValueChange={setTab}
              aria-label="Order status"
            />
            <div className="flex items-center gap-2">
              <FilterSelect label="Courier" options={["All", "Blue Dart", "Delhivery"]} />
              <FilterSelect label="Range" options={["Today", "Last 7 days", "This month"]} />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            emptyMessage="No orders in this status."
          />
          <TablePagination
            key={tab}
            summary={`Showing ${rows.length} order${rows.length === 1 ? "" : "s"} · prepaid only, no COD`}
            pages={1}
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
