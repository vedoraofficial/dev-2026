import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: ReactNode
  /** Small line under the value */
  hint?: ReactNode
  /** Gold outline — the one card that needs attention */
  highlight?: boolean
  /** Colours the label (and the value for "danger") to flag status, e.g. success rate or failures */
  tone?: "success" | "warning" | "danger"
  /** Makes the card a link to the screen that breaks this number down */
  href?: string
  className?: string
}

const labelTone = { success: "text-success", warning: "text-gold", danger: "text-danger" } as const

export function StatCard({ label, value, hint, highlight, tone, href, className }: Props) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("eyebrow", highlight && "text-gold", tone && labelTone[tone])}>{label}</p>
        {href ? (
          <ChevronRight
            aria-hidden
            className="mt-px size-3.5 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-gold"
          />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-[1.875rem] leading-none font-medium md:text-[2.125rem]",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </p>
      {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
    </>
  )

  const cardClass = cn(
    "group min-w-0 rounded-2xl border bg-card p-4 md:p-5",
    highlight ? "border-gold/45" : "border-border",
    href &&
      "transition-colors hover:border-gold/40 hover:bg-accent/30 focus-visible:border-gold/50 focus-visible:ring-3 focus-visible:ring-gold/20 focus-visible:outline-none",
    className,
  )

  if (href) {
    return (
      <Link to={href} className={cardClass}>
        {content}
      </Link>
    )
  }

  return <div className={cardClass}>{content}</div>
}

/** Responsive grid for a row of StatCards: 2 columns on phones, `cols` from `lg`. */
export function StatGrid({
  cols = 4,
  className,
  children,
}: {
  cols?: 3 | 4 | 5 | 6
  className?: string
  children: ReactNode
}) {
  const lg = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "md:grid-cols-3 lg:grid-cols-6",
  }[cols]
  return <div className={cn("grid grid-cols-2 gap-3 md:gap-4", lg, className)}>{children}</div>
}
