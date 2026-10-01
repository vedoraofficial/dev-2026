import { useState } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CashOrderDialog } from "@/features/orders/components/cash-order-dialog"
import { OrderDetailDialog } from "@/features/orders/components/order-detail-dialog"
import {
  orderNo,
  orderStage,
  paymentMethodLabel,
  STAGE_TABS,
  stagePill,
  type OrderStage,
} from "@/features/orders/labels"
import { deliverySla } from "@/features/orders/mock-data"
import { useAllOrders } from "@/features/orders/queries"
import type { ApiOrder } from "@/features/orders/types"
import { useProducts } from "@/features/products/queries"
import { downloadCsv } from "@/lib/csv"
import { formatDate, formatDateTime } from "@/lib/date"
import { formatCompactINR, formatINR, formatNumber } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

type Tab = "all" | OrderStage
const PAGE_SIZE = 15

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()
const sumRupees = (orders: ApiOrder[]) =>
  orders.reduce((sum, o) => sum + paiseToRupees(o.totalAmount), 0)

function matchesQuery(o: ApiOrder, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    orderNo(o.id).toLowerCase().includes(q) ||
    String(o.id) === q ||
    (o.user?.vedId.toLowerCase().includes(q) ?? false) ||
    (o.user?.name.toLowerCase().includes(q) ?? false) ||
    o.product.name.toLowerCase().includes(q)
  )
}

export function AdminOrdersPage() {
  const orders = useAllOrders()
  const products = useProducts()
  const [tab, setTab] = useState<Tab>("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<number | null>(null)

  const list = orders.data ?? []
  const inStage = (stage: Tab) => list.filter((o) => stage === "all" || orderStage(o) === stage)
  const rows = inStage(tab).filter((o) => matchesQuery(o, query))
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const tabs = STAGE_TABS.map((t) => ({ ...t, label: `${t.label} ${inStage(t.value).length}` }))

  const paidToday = list.filter((o) => o.paymentStatus === "PAID" && isToday(o.createdAt))
  const awaiting = inStage("awaiting")
  const confirmed = inStage("confirmed")
  const refunded = inStage("refunded")

  const filterKey = `${tab}|${query}`
  const [syncedKey, setSyncedKey] = useState(filterKey)
  if (filterKey !== syncedKey) {
    setSyncedKey(filterKey)
    setPage(1)
  }

  const columns: Column<ApiOrder>[] = [
    {
      key: "order",
      header: "Order",
      primary: true,
      cell: (r) => (
        <div>
          <MonoId tone="gold" className="text-[0.8125rem]">
            {orderNo(r.id)}
          </MonoId>
          <p className="text-[0.6875rem] text-muted-foreground">{formatDateTime(r.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "partner",
      header: "Partner",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.user?.name ?? "—"}</p>
          <MonoId tone="muted" className="text-[0.6875rem]">
            {r.user?.vedId}
          </MonoId>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (r) => (
        <span className="text-muted-foreground">
          {r.product.name} × {r.quantity}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (r) => <span className="font-mono">{formatINR(paiseToRupees(r.totalAmount))}</span>,
    },
    {
      key: "payment",
      header: "Payment",
      cell: (r) => (
        <span className="text-muted-foreground">{paymentMethodLabel[r.paymentMethod]}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusPill variant={stagePill[orderStage(r)].variant}>
          {stagePill[orderStage(r)].label}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "Action",
      actions: true,
      cell: (r) => (
        <Button variant="quiet" size="sm" onClick={() => setOpenId(r.id)}>
          Details
        </Button>
      ),
    },
  ]

  const exportCsv = () =>
    downloadCsv(
      "vedora-orders.csv",
      [
        "Order",
        "Date",
        "VEDORA ID",
        "Partner",
        "Product",
        "Qty",
        "Amount (₹)",
        "BV",
        "Payment",
        "Status",
      ],
      rows.map((o) => [
        orderNo(o.id),
        formatDate(o.createdAt),
        o.user?.vedId ?? "",
        o.user?.name ?? "",
        o.product.name,
        o.quantity,
        paiseToRupees(o.totalAmount),
        o.bvTotal,
        paymentMethodLabel[o.paymentMethod],
        stagePill[orderStage(o)].label,
      ]),
    )

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Processing within 24–48 business hours of payment · prepaid or cash"
        actions={
          <>
            <Input
              type="search"
              placeholder="Order, partner, product…"
              aria-label="Search orders"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-64"
            />
            <CashOrderDialog
              products={(products.data ?? [])
                .filter((p) => p.status === "ACTIVE")
                .map((p) => ({ id: p.id, name: p.name, priceRupees: paiseToRupees(p.salePrice) }))}
            />
          </>
        }
      />
      <PageBody>
        <StatGrid cols={5} className="[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
          <StatCard
            label="Paid today"
            value={formatNumber(paidToday.length)}
            hint={`${formatCompactINR(sumRupees(paidToday))} collected`}
          />
          <StatCard
            label="Awaiting payment"
            value={formatNumber(awaiting.length)}
            onClick={() => setTab("awaiting")}
            highlight={tab === "awaiting"}
          />
          <StatCard
            label="Confirmed"
            value={formatNumber(confirmed.length)}
            hint="Paid · to dispatch"
            onClick={() => setTab("confirmed")}
            highlight={tab === "confirmed"}
          />
          <StatCard
            label="All orders"
            value={formatNumber(list.length)}
            onClick={() => setTab("all")}
          />
          <StatCard
            label="Refunded"
            value={formatNumber(refunded.length)}
            hint={refunded.length ? formatINR(sumRupees(refunded)) : undefined}
            onClick={() => setTab("refunded")}
            highlight={tab === "refunded"}
          />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              tabs={tabs}
              value={tab}
              onValueChange={(v) => setTab(v as Tab)}
              aria-label="Order status"
            />
            <Button variant="outline" disabled={rows.length === 0} onClick={exportCsv}>
              Export
            </Button>
          </div>
          <QueryState query={orders} rows={6}>
            <DataTable
              columns={columns}
              rows={pageRows}
              getRowKey={(r) => r.id}
              emptyMessage={list.length ? "No orders match." : "No orders yet."}
            />
            <TablePagination
              key={filterKey}
              summary={`Showing ${rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–${Math.min(page * PAGE_SIZE, rows.length)} of ${rows.length} order${rows.length === 1 ? "" : "s"}`}
              pages={Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}
              onPageChange={setPage}
            />
          </QueryState>
        </Panel>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
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

      <OrderDetailDialog orderId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
