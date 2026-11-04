import { GoldDiamond } from "@/website/components/common/gold-diamond"
import { GoldWord } from "@/website/components/common/gold-word"
import { Section, SectionHeading } from "@/website/components/common/section"
import { Button } from "@/website/components/ui/button"
import { ProductShowcase } from "@/website/features/products/components/product-showcase"
import { ProductsHero } from "@/website/features/products/components/products-hero"
import {
  CARE_INSTRUCTIONS,
  countWord,
  NATURAL_VARIATION_NOTE,
  PREMIUM_FEATURES,
  WARRANTY_AND_ORDERING,
} from "@/website/features/products/catalog"
import { lowestPrice, useSiteProducts } from "@/website/features/products/use-site-products"

/** The bracelets come from the backend — whatever Admin has put live in Products. */
export function ProductsPage() {
  const { products, isPending, isError, refetch } = useSiteProducts()
  const count = products.length

  return (
    <>
      <ProductsHero
        title={
          <>
            {isPending ? "Our bracelets" : `${countWord(count)} bracelet${count === 1 ? "" : "s"}`},
            <br />
            one <GoldWord sparkle>standard.</GoldWord>
          </>
        }
        description="Each design combines three natural gemstones in a symmetrical, hand-strung layout. Same craftsmanship, same price, same warranty."
        products={products}
        isPending={isPending}
        price={lowestPrice(products)}
      />

      <Section>
        {isPending ? (
          <div className="space-y-10 md:space-y-14" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} aria-hidden className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
                <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
                <div className="space-y-4">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-20 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="text-[0.875rem] text-muted-foreground">
              We couldn&apos;t load the collection right now.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : count === 0 ? (
          <p className="py-10 text-center text-[0.875rem] text-muted-foreground">
            New bracelets are on their way — check back soon.
          </p>
        ) : (
          <div className="space-y-10 md:space-y-14">
            {products.map((b, i) => (
              <ProductShowcase key={b.id} bracelet={b} reverse={i % 2 === 1} />
            ))}
          </div>
        )}
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
