import { Gem, Hand, ReceiptText, ShieldCheck, Sparkles } from "lucide-react"
import type { ReactNode } from "react"

import { Container } from "@/website/components/common/container"
import { HeroBackdrop } from "@/website/components/common/hero-backdrop"
import { WARRANTY_DAYS } from "@/website/features/products/catalog"
import { Price } from "@/website/features/products/components/price"
import type { SiteProduct } from "@/website/features/products/use-site-products"
import { HERO_BAND, HERO_CARD, ON_PHOTO } from "@/website/lib/hero"
import { cn } from "@/website/lib/utils"

const TRUST = [
  { icon: Gem, label: "3 natural gemstones each" },
  { icon: Hand, label: "Hand-strung" },
  { icon: ReceiptText, label: "GST invoice" },
  { icon: ShieldCheck, label: `${WARRANTY_DAYS}-day warranty` },
] as const

type Props = {
  title: ReactNode
  description: string
  products: SiteProduct[]
  isPending: boolean
  /** Lowest selling price on the site (null while loading) */
  price: { price: number; mrp: number } | null
}

/**
 * Products page opening band — the same light, leafy look as the home hero: title, price and
 * warranty on the left, the bracelets as tiles on the right (each jumps to its section below).
 */
export function ProductsHero({ title, description, products, isPending, price }: Props) {
  return (
    <section className={HERO_BAND}>
      <HeroBackdrop />

      <Container className="relative grid gap-10 pt-6 pb-8 md:pt-8 md:pb-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-16">
        <div className="motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.18em] text-gold-light uppercase">
            <Sparkles aria-hidden className="size-3.5" />
            The collection
          </span>
          <h1 className="mt-6 font-display text-[3rem] leading-[1] font-normal tracking-tight text-balance sm:text-[3.75rem] lg:text-[4.25rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-muted-foreground">
            {description}
          </p>

          <ul className="mt-7 flex flex-wrap gap-2">
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground/85",
                  HERO_CARD,
                )}
              >
                <Icon aria-hidden className="size-3.5 text-gold-light" />
                {label}
              </li>
            ))}
          </ul>

          <dl className="mt-8 grid max-w-md grid-cols-2 gap-3">
            <div className={cn("flex flex-col-reverse rounded-xl p-4", HERO_CARD)}>
              <dt className="mt-1.5 text-[0.6875rem] text-muted-foreground">
                Offer price · GST inclusive
              </dt>
              <dd className="font-display text-[1.875rem] leading-none text-gold-light">
                {price ? <Price price={price.price} mrp={price.mrp} /> : <Price />}
              </dd>
            </div>
            <div className={cn("flex flex-col-reverse rounded-xl p-4", HERO_CARD)}>
              <dt className="mt-1.5 text-[0.6875rem] text-muted-foreground">Defect warranty</dt>
              <dd className="font-display text-[1.875rem] leading-none text-gold-light">
                {WARRANTY_DAYS} days
              </dd>
            </div>
          </dl>
        </div>

        <div className="motion-safe:animate-in motion-safe:delay-150 motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-6">
          <div className="mx-auto grid w-full max-w-[34rem] grid-cols-2 gap-3 md:gap-4">
            {isPending
              ? [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="aspect-square animate-pulse rounded-2xl bg-muted"
                  />
                ))
              : products.slice(0, 4).map((p) => (
                  // Jumps to the bracelet's section further down this page
                  <a
                    key={p.id}
                    href={`#${p.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-gold/40 shadow-xl shadow-deep/25 transition-colors hover:border-gold"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {p.inStock ? null : (
                      <span
                        className={cn(
                          "absolute top-2.5 left-2.5 rounded-full bg-deep/85 px-2 py-0.5 text-[0.5625rem] font-bold tracking-[0.12em] uppercase",
                          ON_PHOTO,
                          "text-muted-foreground",
                        )}
                      >
                        Out of stock
                      </span>
                    )}
                    <div
                      className={cn(
                        "absolute inset-x-2 bottom-2 rounded-lg border border-gold/20 bg-deep/80 px-3 py-2 backdrop-blur-md",
                        ON_PHOTO,
                      )}
                    >
                      <p className="truncate text-[0.75rem] font-semibold">{p.name}</p>
                      <p className="text-[0.6875rem] text-gold-light">
                        <Price price={p.price} mrp={p.mrp} />
                      </p>
                    </div>
                  </a>
                ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
