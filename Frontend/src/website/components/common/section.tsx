import type { ComponentProps, ReactNode } from "react"

import { Container } from "@/website/components/common/container"
import { cn } from "@/website/lib/utils"

const tones = {
  /** Page green */
  default: "",
  /** Darker band (founders' quote) */
  deep: "bg-deep",
  /** Lifted green band (income plan, compliance strip) */
  forest: "bg-linear-to-b from-card to-background",
  /** Light cream band — switches every token inside to the light palette */
  cream: "surface-cream",
} as const

type SectionProps = ComponentProps<"section"> & {
  tone?: keyof typeof tones
  /** Hairline divider on top (used between two dark bands). */
  divided?: boolean
  containerClassName?: string
}

/** A full-width band with the centred content column inside. */
export function Section({
  tone = "default",
  divided = false,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("py-16 md:py-24", tones[tone], divided && "border-t border-border", className)}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}

/** Gold monospace kicker above a title. */
export function Kicker({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("kicker", className)} {...props} />
}

type SectionHeadingProps = {
  kicker: string
  title: ReactNode
  description?: ReactNode
  /** Right-hand slot (a link or a short note), bottom-aligned with the title on desktop. */
  aside?: ReactNode
  align?: "left" | "center"
  className?: string
}

/** Kicker + serif title (+ optional description and right-hand aside). */
export function SectionHeading({
  kicker,
  title,
  description,
  aside,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 md:mb-12",
        aside && "md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div className="max-w-2xl">
        <Kicker>{kicker}</Kicker>
        <h2 className="mt-4 font-display text-[2.25rem] leading-[1.08] font-normal text-balance md:text-[2.75rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0 md:max-w-xs">{aside}</div> : null}
    </div>
  )
}
