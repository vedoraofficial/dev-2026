import type { LucideIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

/** The standard surface: dark-green card with a hairline border. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("min-w-0 rounded-2xl border border-border bg-card p-4 md:p-5", className)}
      {...props}
    />
  )
}

type PanelHeaderProps = {
  title: ReactNode
  /** Gold icon before the title */
  icon?: LucideIcon
  /** Right-aligned content (a total, a link, a filter…) */
  aside?: ReactNode
  className?: string
}

/** Deep green title bar across the top of a Panel (it must be the Panel's first child). */
export function PanelHeader({ title, icon: Icon, aside, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "-mx-4 -mt-4 mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-t-[calc(var(--radius-2xl)-1px)] px-4 py-3 surface-deep md:-mx-5 md:-mt-5 md:mb-5 md:px-5 md:py-3.5",
        className,
      )}
    >
      <h2 className="flex items-center gap-2.5 font-display text-[1.25rem] leading-tight font-medium text-foreground">
        {Icon ? <Icon aria-hidden className="size-5 shrink-0 text-gold-light" /> : null}
        {title}
      </h2>
      {aside ? <div className="text-xs text-muted-foreground">{aside}</div> : null}
    </div>
  )
}
