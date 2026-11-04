import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { CtaPanel } from "@/website/components/common/cta-panel"
import { GoldDiamond } from "@/website/components/common/gold-diamond"
import { Kicker, Section, SectionHeading } from "@/website/components/common/section"
import { Button } from "@/website/components/ui/button"
import { FOUNDER_SHORT_NAMES, FOUNDERS_QUOTE } from "@/website/features/about/content"
import { HomeHero } from "@/website/features/home/components/home-hero"
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/website/features/products/components/product-card"
import { countWord, WARRANTY_DAYS } from "@/website/features/products/catalog"
import { useSiteProducts } from "@/website/features/products/use-site-products"

/** Hero numbers — the bracelet count is what Admin has on sale (null while loading). */
const heroStats = (bracelets: number | null) => [
  { value: "100%", label: "Natural gemstone beads" },
  { value: bracelets === null ? "—" : String(bracelets), label: "Signature bracelets" },
  { value: `${WARRANTY_DAYS}-day`, label: "Defect warranty" },
]

const WHY_VEDORA = [
  {
    title: "Natural gemstones",
    body: "Every bead is genuine stone. Colour and pattern vary slightly — that's how you know it's real.",
  },
  {
    title: "Handcrafted finish",
    body: "Strung by hand on a comfortable stretch fit, lightweight enough to wear every day.",
  },
  {
    title: "Unisex by design",
    body: "One premium design language for men and women, gift-ready out of the box.",
  },
  {
    title: "Backed by warranty",
    body: "7-day manufacturing defect warranty, GST invoice on every order, prepaid and secure.",
  },
] as const

export function HomePage() {
  // The collection comes from the backend — whatever Admin has put live in Products.
  const { products, isPending } = useSiteProducts()
  const HERO_STATS = heroStats(isPending ? null : products.length)
  const designs = countWord(products.length)

  return (
    <>
      <HomeHero products={products} isPending={isPending} stats={HERO_STATS} />

      <Section>
        <SectionHeading
          kicker="The collection"
          title={
            isPending || products.length === 4
              ? "Four stones. Four designs."
              : `${designs} design${products.length === 1 ? "" : "s"}, natural stones.`
          }
          aside={
            <Link
              to={ROUTES.products}
              className="text-[0.8125rem] font-semibold text-gold hover:text-gold-light"
            >
              View all products →
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isPending
            ? [0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)
            : products.map((b) => <ProductCard key={b.id} bracelet={b} />)}
        </div>
        {!isPending && products.length === 0 ? (
          <p className="text-[0.875rem] text-muted-foreground">
            New bracelets are on their way — check back soon.
          </p>
        ) : null}
      </Section>

      <Section tone="cream">
        <SectionHeading
          kicker="Why VEDORA"
          title={
            <>
              Crafted to be
              <br />
              worn, not stored.
            </>
          }
        />
        <div className="grid gap-x-12 gap-y-8 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 md:p-8">
          {WHY_VEDORA.map((f) => (
            <div key={f.title}>
              <GoldDiamond className="size-2" />
              <h3 className="mt-3 text-[0.9375rem] font-bold">{f.title}</h3>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="deep" divided className="text-center">
        <Kicker>From our founders</Kicker>
        <blockquote className="mx-auto mt-6 max-w-3xl font-display text-[1.625rem] leading-snug text-foreground/90 italic md:text-[2.125rem]">
          “{FOUNDERS_QUOTE}”
        </blockquote>
        <p className="mt-6 text-[0.8125rem] text-muted-foreground">{FOUNDER_SHORT_NAMES}</p>
        <Link
          to={ROUTES.founders}
          className="mt-4 inline-block text-[0.8125rem] font-semibold text-gold hover:text-gold-light"
        >
          Meet the founders →
        </Link>
      </Section>

      <Section>
        <CtaPanel
          title={
            <>
              Ready to find
              <br />
              your bracelet?
            </>
          }
          description="Explore the collection, or talk to us and we'll help you choose."
          actions={
            <>
              <Button size="lg" asChild>
                <Link to={ROUTES.products}>Explore the collection</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={ROUTES.contact}>Contact us</Link>
              </Button>
            </>
          }
        />
      </Section>
    </>
  )
}
