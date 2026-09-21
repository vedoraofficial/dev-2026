import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { products } from "@/features/products/mock-data"
import { formatBV, formatNumber } from "@/lib/format"

const totalUnits = products.reduce((sum, p) => sum + p.unitsSold, 0)

export function AdminProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Four SKUs · ₹1,999 MRP GST as per Indian law · 7-day manufacturing defect warranty"
        actions={
          <>
            <Button variant="quiet" disabled>
              Add SKU — disabled
            </Button>
            <Button>Save catalogue</Button>
          </>
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard label="Units sold this month" value={formatNumber(totalUnits)} />
          <StatCard label="BV generated" value={formatNumber(totalUnits * 1000)} />
          <StatCard highlight label="BV conversion" value="1 BV = ₹1" />
          <StatCard label="Warranty" value="7 days" hint="Manufacturing defects only" />
        </StatGrid>

        {products.map((p) => (
          <Panel
            key={p.sku}
            className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-5 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
          >
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              width={1000}
              height={750}
              className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
            />

            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <MonoId tone="gold" className="text-[0.6875rem]">
                  {p.sku}
                </MonoId>
                <StatusPill variant={p.status === "live" ? "success" : "neutral"}>
                  {p.status === "live" ? "Live" : "Draft"}
                </StatusPill>
              </div>

              <Input defaultValue={p.name} aria-label={`${p.sku} name`} />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Input defaultValue={`₹ ${formatNumber(p.price)}`} aria-label={`${p.sku} price`} />
                <Input
                  defaultValue={formatBV(p.bv)}
                  aria-label={`${p.sku} BV`}
                  className="font-mono text-gold"
                />
              </div>

              <div className="rounded-xl border border-border bg-field/60 p-3.5">
                <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {p.gemstones.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[0.6875rem] text-gold-light"
                    >
                      {g}
                    </span>
                  ))}
                  <button
                    type="button"
                    className="text-[0.6875rem] font-medium text-gold hover:underline"
                  >
                    Read more →
                  </button>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{p.unitsSold} sold</span>
                <button type="button" className="font-medium text-gold hover:underline">
                  Edit details
                </button>
              </div>
            </div>
          </Panel>
        ))}
      </PageBody>
    </>
  )
}
