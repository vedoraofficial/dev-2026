import { Sparkles } from "lucide-react"
import type { ComponentType, ReactNode } from "react"

import { Container } from "@/website/components/common/container"
import { HeroBackdrop } from "@/website/components/common/hero-backdrop"
import { Kicker } from "@/website/components/common/section"
import { HERO_BAND, HERO_CARD } from "@/website/lib/hero"
import { cn } from "@/website/lib/utils"

type PageHeroProps = {
  kicker: string
  title: ReactNode
  description?: ReactNode
  /** Buttons under the description. */
  actions?: ReactNode
  /** Content under the actions (e.g. a stats row). */
  footer?: ReactNode
  /** Right-hand column (an image card, or stats). */
  aside?: ReactNode
  /** `end` bottom-aligns a small aside (stats) with the copy. */
  asideAlign?: "center" | "end"
  /** `portal` is the home hero's look: light cream with leaves, kicker as a pill, less top space. */
  tone?: "default" | "portal"
  className?: string
}

/** The opening band of every page: kicker, large serif title, lead text, optional aside. */
export function PageHero({
  kicker,
  title,
  description,
  actions,
  footer,
  aside,
  asideAlign = "center",
  tone = "default",
  className,
}: PageHeroProps) {
  const portal = tone === "portal"

  return (
    <section className={cn(portal ? HERO_BAND : "border-b border-border hero-lines", className)}>
      {portal ? <HeroBackdrop /> : null}
      <Container
        className={cn(
          "grid gap-10",
          portal ? "relative pt-6 pb-8 md:pt-8 md:pb-10" : "py-10 md:py-12",
          aside &&
            (asideAlign === "end"
              ? "lg:grid-cols-[1fr_auto] lg:items-end"
              : "lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14"),
        )}
      >
        <div
          className={cn(
            portal &&
              "motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4",
          )}
        >
          {portal ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.18em] text-gold-light uppercase">
              <Sparkles aria-hidden className="size-3.5" />
              {kicker}
            </span>
          ) : (
            <Kicker>{kicker}</Kicker>
          )}
          <h1
            className={cn(
              "font-display font-normal text-balance",
              portal
                ? "mt-6 text-[3rem] leading-[1] tracking-tight sm:text-[3.75rem] lg:text-[4.25rem]"
                : "mt-5 text-[2.75rem] leading-[1.04] sm:text-[3.25rem] lg:text-[3.5rem]",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
          {footer}
        </div>
        {aside ? (
          <div
            className={cn(
              portal &&
                "motion-safe:animate-in motion-safe:delay-150 motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-6",
            )}
          >
            {aside}
          </div>
        ) : null}
      </Container>
    </section>
  )
}

/** Small rounded facts under a portal hero's copy (icon + label). */
export function HeroChips({
  items,
}: {
  items: readonly { icon: ComponentType<{ className?: string }>; label: string }[]
}) {
  return (
    <ul className="mt-7 flex flex-wrap gap-2">
      {items.map(({ icon: Icon, label }) => (
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
  )
}

/** Number cards under a portal hero's copy. */
export function HeroStatCards({ stats }: { stats: readonly { value: string; label: string }[] }) {
  return (
    <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn("flex flex-col-reverse rounded-xl p-3.5 md:p-4", HERO_CARD)}
        >
          <dt className="mt-1.5 text-[0.6875rem] leading-snug text-muted-foreground">{s.label}</dt>
          <dd className="font-display text-[1.625rem] leading-none text-gold-light md:text-[1.875rem]">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
