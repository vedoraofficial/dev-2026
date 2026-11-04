import {
  ArrowRight,
  Gem,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { Container } from "@/website/components/common/container"
import { GoldWord } from "@/website/components/common/gold-word"
import { HeroBackdrop } from "@/website/components/common/hero-backdrop"
import { Button } from "@/website/components/ui/button"
import { stoneLine, WARRANTY_DAYS } from "@/website/features/products/catalog"
import { Price } from "@/website/features/products/components/price"
import type { SiteProduct } from "@/website/features/products/use-site-products"
import { HERO_BAND, HERO_CARD, ON_PHOTO } from "@/website/lib/hero"
import { whatsappLink } from "@/website/lib/site"

const TRUST = [
  { icon: Gem, label: "100% natural gemstones" },
  { icon: ShieldCheck, label: `${WARRANTY_DAYS}-day warranty` },
  { icon: ReceiptText, label: "GST invoice" },
  { icon: Truck, label: "Ships across India" },
] as const

type Props = {
  products: SiteProduct[]
  isPending: boolean
  stats: { value: string; label: string }[]
}

/**
 * Home page opening band in the portal's look: light cream with leafy branches and soft gold light, the
 * brand line and actions on the left, the featured bracelet (plus the rest of the collection as
 * thumbnails) on the right.
 */
export function HomeHero({ products, isPending, stats }: Props) {
  const [featured, ...others] = products

  return (
    <section className={HERO_BAND}>
      <HeroBackdrop />

      <Container className="relative grid gap-10 pt-6 pb-8 md:pt-8 md:pb-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-16">
        <div className="motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.18em] text-gold-light uppercase">
            <Sparkles aria-hidden className="size-3.5" />
            Premium natural gemstone brand
          </span>
          <h1 className="mt-6 font-display text-[3.25rem] leading-[0.95] font-normal tracking-tight sm:text-[4rem] lg:text-[4.75rem]">
            <span className="block">
              Wear{" "}
              <span className="relative inline-block">
                Your
                <span aria-hidden className="absolute -top-1 -right-4 text-[0.35em] text-gold">
                  ✦
                </span>
              </span>
            </span>
            <GoldWord>Energy</GoldWord>
          </h1>
          <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-muted-foreground">
            Handcrafted bracelets of Pyrite, Tiger Eye, Citrine and Onyx — natural gemstones,
            hand-strung for everyday wear.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Link to={ROUTES.products}>
                Explore the collection
                <ArrowRight aria-hidden data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href={whatsappLink("Hi VEDORA, I'd like to know more about your bracelets.")}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle aria-hidden data-icon="inline-start" />
                Chat on WhatsApp
              </a>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground/85 ${HERO_CARD}`}
              >
                <Icon aria-hidden className="size-3.5 text-gold-light" />
                {label}
              </li>
            ))}
          </ul>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`flex flex-col-reverse rounded-xl p-3.5 md:p-4 ${HERO_CARD}`}
              >
                <dt className="mt-1.5 text-[0.6875rem] leading-snug text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="font-display text-[1.625rem] leading-none text-gold-light md:text-[1.875rem]">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="motion-safe:animate-in motion-safe:delay-150 motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-6">
          {isPending || !featured ? (
            <div
              aria-hidden
              className="mx-auto aspect-[5/4] w-full max-w-[34rem] animate-pulse rounded-2xl bg-muted"
            />
          ) : (
            <div className="mx-auto w-full max-w-[34rem]">
              <div className="relative">
                {/* Gold frame peeking out behind the photo (only the photo, not the thumbnails) */}
                <div
                  aria-hidden
                  className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-2xl border border-gold/60"
                />
                <div className="relative overflow-hidden rounded-2xl border border-gold/30 shadow-2xl shadow-deep/30">
                  <img
                    src={featured.image}
                    alt={featured.name}
                    className="aspect-[5/4] w-full object-cover"
                  />
                  <span
                    className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-deep/80 px-3 py-1 text-[0.6875rem] font-semibold backdrop-blur-md ${ON_PHOTO} text-gold-light`}
                  >
                    <Sparkles aria-hidden className="size-3" />
                    Handcrafted in India
                  </span>
                  <div
                    className={`absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-deep/80 px-4 py-3 backdrop-blur-md md:inset-x-4 md:bottom-4 ${ON_PHOTO}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.8125rem] font-bold">{featured.name}</p>
                      {featured.stones.length ? (
                        <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
                          {stoneLine(featured)}
                        </p>
                      ) : null}
                    </div>
                    <Price
                      price={featured.price}
                      mrp={featured.mrp}
                      className="shrink-0 font-display text-[1.5rem] leading-none text-gold-light"
                    />
                  </div>
                </div>
              </div>

              {/* The rest of the collection, one tap away */}
              {others.length ? (
                <div className="relative mt-6 grid grid-cols-3 gap-3">
                  {others.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      to={`${ROUTES.products}#${p.slug}`}
                      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-gold/60"
                    >
                      <img
                        src={p.image}
                        alt=""
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <p className="truncate px-2.5 py-2 text-[0.6875rem] font-medium">{p.name}</p>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
