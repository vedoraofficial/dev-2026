import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const variants = {
  success: "bg-success-soft text-success ring-success/25",
  pending: "bg-warning-soft text-warning ring-warning/25",
  danger: "bg-danger-soft text-danger ring-danger/25",
  neutral: "bg-muted text-muted-foreground ring-foreground/10",
  gold: "bg-gold/15 text-gold-light ring-gold/30",
} as const

export type PillVariant = keyof typeof variants

export function StatusPill({
  variant = "neutral",
  dot,
  className,
  children,
}: {
  variant?: PillVariant
  /** Small coloured dot before the text */
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap ring-1 ring-inset",
        variants[variant],
        dot && "gap-1.5",
        className,
      )}
    >
      {dot ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}
