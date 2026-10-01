import { PageBody, PageHeader } from "@/components/common/page-header"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { ProductCard } from "@/features/products/components/product-card"
import { products } from "@/features/products/mock-data"
import { formatNumber } from "@/lib/format"

const totalUnits = products.reduce((sum, p) => sum + p.unitsSold, 0)

export function AdminProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Four SKUs · ₹1,999 MRP GST as per Indian law · 7-day manufacturing defect warranty"
      />
      <PageBody>
        <StatGrid>
          <StatCard label="Units sold this month" value={formatNumber(totalUnits)} />
          <StatCard label="BV generated" value={formatNumber(totalUnits * 1000)} />
          <StatCard label="BV conversion" value="1 BV = ₹1" />
          <StatCard label="Warranty" value="7 days" hint="Manufacturing defects only" />
        </StatGrid>

        {products.map((p) => (
          <ProductCard key={p.sku} product={p} soldLabel={`${p.unitsSold} sold`} />
        ))}
      </PageBody>
    </>
  )
}
