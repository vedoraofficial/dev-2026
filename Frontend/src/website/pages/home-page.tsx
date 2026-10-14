import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { CtaPanel } from "@/website/components/common/cta-panel"
import { GoldDiamond } from "@/website/components/common/gold-diamond"
import { PageHero } from "@/website/components/common/page-hero"
import { Kicker, Section, SectionHeading } from "@/website/components/common/section"
import { Button } from "@/website/components/ui/button"
import { FOUNDER_SHORT_NAMES, FOUNDERS_QUOTE } from "@/website/features/about/content"
import { Price } from "@/website/features/products/components/price"
import { ProductCard } from "@/website/features/products/components/product-card"
import { BRACELETS, stoneLine, WARRANTY_DAYS } from "@/website/features/products/catalog"

const HERO_STATS = [
  { value: "100%", label: "Natural gemstone beads" },
  { value: String(BRACELETS.length), label: "Signature bracelets" },
  { value: `${WARRANTY_DAYS}-day`, label: "Defect warranty" },
] as const

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

function HeroImage() {
  const featured = BRACELETS[0]
  return (
    <div className="relative mx-auto w-full max-w-[34rem] overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/50">
      <img src={featured.image} alt={featured.name} className="aspect-[5/4] w-full object-cover" />
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/85 px-4 py-3 backdrop-blur-md md:inset-x-4 md:bottom-4">
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-bold">{featured.name}</p>
          <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
            {stoneLine(featured)}
          </p>
        </div>
        <Price className="shrink-0 font-display text-[1.5rem] leading-none text-gold" />
      </div>
    </div>
  )
}

export function HomePage() {
  return (
    <>
      <PageHero
        kicker="Premium natural gemstone brand"
        title={
          <>
            Wear Your
            <br />
            <em className="text-gold-light">Energy</em>
          </>
        }
        description="Handcrafted bracelets of Pyrite, Tiger Eye, Citrine and Onyx — natural gemstones, hand-strung for everyday wear."
        actions={
          <>
            <Button size="lg" asChild>
              <Link to={ROUTES.products}>Explore the collection</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={ROUTES.becomePartner}>Become a Partner</Link>
            </Button>
          </>
        }
        footer={
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1.5 text-[0.6875rem] text-muted-foreground">{s.label}</dt>
                <dd className="font-display text-[1.75rem] leading-none">{s.value}</dd>
              </div>
            ))}
          </dl>
        }
        aside={<HeroImage />}
      />

      <Section>
        <SectionHeading
          kicker="The collection"
          title="Four stones. Four designs."
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
          {BRACELETS.map((b) => (
            <ProductCard key={b.slug} bracelet={b} />
          ))}
        </div>
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
              Ready to wear it —
              <br />
              or to join us?
            </>
          }
          description="Talk to us about the collection, or register your interest as a VEDORA partner."
          actions={
            <>
              <Button size="lg" asChild>
                <Link to={ROUTES.becomePartner}>Become a Partner</Link>
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
