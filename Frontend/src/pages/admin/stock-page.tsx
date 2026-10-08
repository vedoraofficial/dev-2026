import { Minus, Plus } from "lucide-react"
import { useState } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { StockEntryDialog } from "@/features/stock/components/stock-entry-dialog"
import { useStock, useStockMovements } from "@/features/stock/queries"
import type { StockMovement, StockRow } from "@/features/stock/types"
import { formatDateTime } from "@/lib/date"
import { formatNumber } from "@/lib/format"

const ALL_PRODUCTS = "All products"

function StockStatus({ row }: { row: StockRow }) {
  if (row.available <= 0) return <StatusPill variant="danger">Out of stock</StatusPill>
  return <StatusPill variant="success">In stock</StatusPill>
}

const stockColumns: Column<StockRow>[] = [
  {
    key: "product",
    header: "Product",
    primary: true,
    cell: (r) => (
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{r.name}</span>
        {r.status === "INACTIVE" ? <StatusPill>Draft</StatusPill> : null}
      </span>
    ),
  },
  { key: "status", header: "Status", cell: (r) => <StockStatus row={r} /> },
  {
    key: "received",
    header: "Received",
    align: "right",
    cell: (r) => formatNumber(r.received),
  },
  {
    key: "sold",
    header: "Sold",
    align: "right",
    cell: (r) => formatNumber(r.sold),
  },
  {
    key: "available",
    header: "Available",
    align: "right",
    cell: (r) => (
      <span className={r.available <= 0 ? "font-medium text-danger" : "font-medium"}>
        {formatNumber(r.available)}
      </span>
    ),
  },
  {
    key: "updated",
    header: "Last entry",
    cell: (r) => (r.lastMovementAt ? formatDateTime(r.lastMovementAt) : "—"),
  },
  {
    key: "actions",
    header: "Actions",
    actions: true,
    cell: (r) => (
      <>
        <StockEntryDialog
          row={r}
          type="IN"
          trigger={
            <Button size="sm">
              <Plus /> Add stock
            </Button>
          }
        />
        <StockEntryDialog
          row={r}
          type="OUT"
          trigger={
            <Button size="sm" variant="outline" disabled={r.available <= 0}>
              <Minus /> Record sale
            </Button>
          }
        />
      </>
    ),
  },
]

const movementColumns: Column<StockMovement>[] = [
  {
    key: "product",
    header: "Product",
    primary: true,
    cell: (m) => <span className="font-medium text-foreground">{m.productName ?? "—"}</span>,
  },
  {
    key: "type",
    header: "Entry",
    cell: (m) =>
      m.type === "IN" ? (
        <StatusPill variant="success">Received</StatusPill>
      ) : (
        <StatusPill variant="gold">Sold</StatusPill>
      ),
  },
  {
    key: "quantity",
    header: "Units",
    align: "right",
    cell: (m) => (
      <span className={m.type === "IN" ? "text-success" : "text-gold-light"}>
        {m.type === "IN" ? "+" : "−"}
        {formatNumber(m.quantity)}
      </span>
    ),
  },
  { key: "note", header: "Note", cell: (m) => m.note || "—" },
  { key: "by", header: "By", cell: (m) => m.createdBy?.name ?? "—" },
  { key: "date", header: "Date", cell: (m) => formatDateTime(m.createdAt) },
]

export function AdminStockPage() {
  const stock = useStock()
  const [filter, setFilter] = useState(ALL_PRODUCTS)
  const rows = stock.data ?? []
  const filtered = rows.find((r) => r.name === filter)
  const movements = useStockMovements(filtered?.productId)

  const totalAvailable = rows.reduce((sum, r) => sum + r.available, 0)
  const totalSold = rows.reduce((sum, r) => sum + r.sold, 0)
  const outOfStock = rows.filter((r) => r.available <= 0).length

  return (
    <>
      <PageHeader
        title="Stock"
        subtitle="Add units as they arrive and record sales — at 0 (or before any stock is added) a product shows as out of stock"
      />
      <PageBody>
        <StatGrid>
          <StatCard
            label="Units available"
            value={stock.data ? formatNumber(totalAvailable) : "—"}
          />
          <StatCard label="Units sold" value={stock.data ? formatNumber(totalSold) : "—"} />
          <StatCard
            label="Out of stock"
            value={stock.data ? formatNumber(outOfStock) : "—"}
            tone={outOfStock > 0 ? "danger" : undefined}
            hint="Partners can't order these"
          />
          <StatCard
            label="In stock"
            value={stock.data ? formatNumber(rows.length - outOfStock) : "—"}
            hint="Products partners can order"
          />
        </StatGrid>

        <Panel>
          <PanelHeader title="Stock by product" />
          <QueryState
            query={stock}
            rows={3}
            empty={rows.length === 0}
            emptyMessage="No products yet — add one under Products first."
          >
            <DataTable columns={stockColumns} rows={rows} getRowKey={(r) => r.productId} />
          </QueryState>
        </Panel>

        <Panel>
          <PanelHeader
            title="Stock history"
            aside={
              rows.length > 0 ? (
                <FilterSelect
                  label="Product"
                  options={[ALL_PRODUCTS, ...rows.map((r) => r.name)]}
                  defaultValue={ALL_PRODUCTS}
                  onValueChange={setFilter}
                />
              ) : null
            }
          />
          <QueryState query={movements} rows={3}>
            <DataTable
              columns={movementColumns}
              rows={movements.data ?? []}
              getRowKey={(m) => m.id}
              emptyMessage="No stock entries yet."
            />
          </QueryState>
        </Panel>
      </PageBody>
    </>
  )
}
