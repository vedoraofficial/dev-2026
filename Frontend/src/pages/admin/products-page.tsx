import { Plus } from "lucide-react"
import { useState } from "react"

import { PageBody, PageHeader } from "@/components/common/page-header"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import { useAllOrders } from "@/features/orders/queries"
import { unitsByProduct } from "@/features/products/catalog"
import { ProductEditor } from "@/features/products/components/product-editor"
import { useProducts } from "@/features/products/queries"
import { formatNumber } from "@/lib/format"

export function AdminProductsPage() {
  const products = useProducts()
  const orders = useAllOrders()
  const [adding, setAdding] = useState(false)

  const paid = (orders.data ?? []).filter((o) => o.paymentStatus === "PAID")
  const sold = unitsByProduct(paid)
  const totalUnits = paid.reduce((sum, o) => sum + o.quantity, 0)
  const totalBv = paid.reduce((sum, o) => sum + o.bvTotal, 0)
  const list = products.data ?? []

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="GST as per Indian law · 7-day manufacturing defect warranty"
        actions={
          <Button onClick={() => setAdding(true)} disabled={adding}>
            <Plus /> Add product
          </Button>
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard label="Units sold" value={orders.data ? formatNumber(totalUnits) : "—"} />
          <StatCard label="BV generated" value={orders.data ? formatNumber(totalBv) : "—"} />
          <StatCard label="BV conversion" value="1 BV = ₹1" />
          <StatCard label="Warranty" value="7 days" hint="Manufacturing defects only" />
        </StatGrid>

        {adding ? <ProductEditor onDone={() => setAdding(false)} /> : null}

        <QueryState
          query={products}
          rows={3}
          empty={list.length === 0 && !adding}
          emptyMessage="No products yet — add the first one."
        >
          {list.map((p) => (
            <ProductEditor key={p.id} product={p} soldLabel={`${sold.get(p.id) ?? 0} sold`} />
          ))}
        </QueryState>
      </PageBody>
    </>
  )
}
