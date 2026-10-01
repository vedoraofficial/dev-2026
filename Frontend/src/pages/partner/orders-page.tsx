import { useState } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { DataTable, type Column } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { OrderDetailDialog } from "@/features/orders/components/order-detail-dialog"
import {
  canPay,
  orderNo,
  orderStage,
  paymentMethodLabel,
  STAGE_TABS,
  stagePill,
  type OrderStage,
} from "@/features/orders/labels"
import { useMyOrders } from "@/features/orders/queries"
import type { ApiOrder } from "@/features/orders/types"
import { useCheckPayment, usePayOrder } from "@/features/payments/queries"
import { formatDate } from "@/lib/date"
import { formatINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

type Tab = "all" | OrderStage

const total = (orders: ApiOrder[]) =>
  formatINR(orders.reduce((sum, o) => sum + paiseToRupees(o.totalAmount), 0))

export function PartnerOrdersPage() {
  const orders = useMyOrders()
  const payOrder = usePayOrder()
  const checkPayment = useCheckPayment()
  const [tab, setTab] = useState<Tab>("all")
  const [openId, setOpenId] = useState<number | null>(null)

  const list = orders.data ?? []
  const inStage = (stage: Tab) => list.filter((o) => stage === "all" || orderStage(o) === stage)
  const rows = inStage(tab)
  const tabs = STAGE_TABS.map((t) => ({ ...t, label: `${t.label} ${inStage(t.value).length}` }))

  const awaiting = inStage("awaiting")
  const refunded = inStage("refunded")
  const failed = inStage("failed")
  const oldest = list.length ? list[list.length - 1] : undefined

  const pay = (id: number) => payOrder.mutate(id)

  const columns: Column<ApiOrder>[] = [
    {
      key: "order",
      header: "Order",
      primary: true,
      cell: (r) => (
        <MonoId tone="gold" className="text-[0.8125rem]">
          {orderNo(r.id)}
        </MonoId>
      ),
    },
    {
      key: "product",
      header: "Product",
      cell: (r) => (
        <div>
          <p className="font-medium">
            {r.product.name}
            {r.quantity > 1 ? ` × ${r.quantity}` : ""}
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">{formatDate(r.createdAt)}</p>
        </div>
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
      key: "action",
      header: "Action",
      actions: true,
      cell: (r) => (
        <>
          {canPay(r) ? (
            <Button size="sm" disabled={payOrder.isPending} onClick={() => pay(r.id)}>
              {orderStage(r) === "failed" ? "Retry payment" : "Pay now"}
            </Button>
          ) : null}
          <Button variant="quiet" size="sm" onClick={() => setOpenId(r.id)}>
            Details
          </Button>
        </>
      ),
    },
  ]

  const statProps = (value: Tab) => ({
    highlight: tab === value,
    pressed: tab === value,
    onClick: () => setTab(value),
  })

  return (
    <>
      <PageHeader
        title="My Orders"
        subtitle="Prepaid orders only · paid online with PhonePe"
        actions={
          <Button asChild>
            <Link to={ROUTES.partner.products}>Place new order</Link>
          </Button>
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard
            label="Total orders"
            value={list.length}
            hint={oldest ? `Since ${formatDate(oldest.createdAt)}` : "No orders yet"}
            {...statProps("all")}
          />
          <StatCard
            label="Awaiting payment"
            value={awaiting.length}
            hint={awaiting.length ? `${total(awaiting)} to pay` : "Nothing to pay"}
            {...statProps("awaiting")}
          />
          <StatCard
            label="Refunded"
            value={refunded.length}
            hint={refunded.length ? `${total(refunded)} refunded` : "No refunds"}
            {...statProps("refunded")}
          />
          <StatCard
            label="Failed"
            tone={failed.length ? "danger" : undefined}
            value={failed.length}
            hint={
              failed.length
                ? `${total(failed)} not paid · retry payment`
                : "All payments went through"
            }
            {...statProps("failed")}
          />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <FilterTabs
              tabs={tabs}
              value={tab}
              onValueChange={(v) => setTab(v as Tab)}
              aria-label="Order status"
            />
          </div>
          <QueryState query={orders} rows={5}>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(r) => r.id}
              emptyMessage={
                list.length ? "No orders here." : "No orders yet — order from Products."
              }
            />
          </QueryState>
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
        </Panel>
      </PageBody>

      <OrderDetailDialog
        orderId={openId}
        onClose={() => setOpenId(null)}
        actions={(o) => (
          <>
            {o.phonepeMerchantOrderId && o.paymentStatus === "PENDING" ? (
              <Button
                variant="outline"
                disabled={checkPayment.isPending}
                onClick={() => checkPayment.mutate(o.phonepeMerchantOrderId ?? "")}
              >
                {checkPayment.isPending ? "Checking…" : "Check payment status"}
              </Button>
            ) : null}
            {canPay(o) ? (
              <Button disabled={payOrder.isPending} onClick={() => pay(o.id)}>
                {payOrder.isPending ? "Opening PhonePe…" : "Pay now"}
              </Button>
            ) : null}
          </>
        )}
      />
    </>
  )
}
