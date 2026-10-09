import { GoldDiamond } from "@/website/components/common/gold-diamond"
import { PageHero } from "@/website/components/common/page-hero"
import { Section, SectionHeading } from "@/website/components/common/section"
import { ProductShowcase } from "@/website/features/products/components/product-showcase"
import {
  BRACELET_PRICE,
  BRACELETS,
  CARE_INSTRUCTIONS,
  NATURAL_VARIATION_NOTE,
  PREMIUM_FEATURES,
  WARRANTY_AND_ORDERING,
  WARRANTY_DAYS,
} from "@/website/features/products/catalog"
import { formatINR } from "@/website/lib/format"

function HeroStats() {
  return (
    <dl className="flex gap-10">
      <div className="flex flex-col-reverse">
        <dt className="mt-1.5 text-[0.6875rem] text-muted-foreground">MRP · GST inclusive</dt>
        <dd className="font-display text-[2rem] leading-none">{formatINR(BRACELET_PRICE)}</dd>
      </div>
      <div className="flex flex-col-reverse">
        <dt className="mt-1.5 text-[0.6875rem] text-muted-foreground">Defect warranty</dt>
        <dd className="font-display text-[2rem] leading-none">{WARRANTY_DAYS} days</dd>
      </div>
    </dl>
  )
}

export function ProductsPage() {
  return (
    <>
      <PageHero
        kicker="The collection"
        title={
          <>
            Four bracelets,
            <br />
            one standard.
          </>
        }
        description="Each design combines three natural gemstones chosen for a single intention. Same craftsmanship, same price, same warranty."
        aside={<HeroStats />}
        asideAlign="end"
      />

      <Section className="md:py-20">
        <div className="space-y-20 md:space-y-28">
          {BRACELETS.map((b, i) => (
            <ProductShowcase key={b.slug} bracelet={b} reverse={i % 2 === 1} />
          ))}
        </div>
      </Section>

      <Section tone="cream" containerClassName="grid gap-6 lg:grid-cols-3">
        <div>
          <SectionHeading kicker="In every bracelet" title="Premium features" className="mb-6" />
          <ul className="divide-y divide-border border-y border-border">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 py-3.5 text-[0.8125rem] font-semibold">
                <GoldDiamond />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
          <h3 className="text-[1rem] font-bold">Care instructions</h3>
          <div className="mt-4 space-y-3 text-[0.8125rem] leading-relaxed">
            {CARE_INSTRUCTIONS.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </div>
          <p className="mt-5 border-t border-border pt-4 text-[0.75rem] leading-relaxed text-muted-foreground">
            {NATURAL_VARIATION_NOTE}
          </p>
        </div>

        <div className="rounded-2xl surface-panel p-6 md:p-7">
          <h3 className="text-[1rem] font-bold">Warranty &amp; ordering</h3>
          <div className="mt-4 space-y-4 text-[0.8125rem] leading-relaxed text-foreground/80">
            {WARRANTY_AND_ORDERING.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        </div>
      </Section>
    </>
  )
}
