import { PageBody, PageHeader } from "@/components/common/page-header"
import { ProductCard } from "@/features/products/components/product-card"
import { partnerUnitsSold, products } from "@/features/products/mock-data"

/** Same catalogue as Admin › Products, without the stat cards — "sold" is this partner's own. */
export function PartnerProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Four SKUs · ₹1,999 MRP GST as per Indian law · 7-day manufacturing defect warranty"
      />
      <PageBody>
        {products.map((p) => (
          <ProductCard
            key={p.sku}
            product={p}
            soldLabel={`${partnerUnitsSold[p.sku] ?? 0} sold by you`}
          />
        ))}
      </PageBody>
    </>
  )
}
