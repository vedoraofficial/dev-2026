import type { ReactNode } from "react"

import { Container } from "@/website/components/common/container"
import { Kicker } from "@/website/components/common/section"
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
  className,
}: PageHeroProps) {
  return (
    <section className={cn("border-b border-border hero-lines", className)}>
      <Container
        className={cn(
          "grid gap-10 py-14 md:py-20",
          aside &&
            (asideAlign === "end"
              ? "lg:grid-cols-[1fr_auto] lg:items-end"
              : "lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14"),
        )}
      >
        <div>
          <Kicker>{kicker}</Kicker>
          <h1 className="mt-5 font-display text-[2.75rem] leading-[1.04] font-normal text-balance sm:text-[3.25rem] lg:text-[3.5rem]">
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
        {aside ? <div>{aside}</div> : null}
      </Container>
    </section>
  )
}
