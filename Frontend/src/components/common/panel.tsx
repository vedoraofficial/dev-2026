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
  /** Right-aligned content (a total, a link, a filter…) */
  aside?: ReactNode
  className?: string
}

export function PanelHeader({ title, aside, className }: PanelHeaderProps) {
  return (
    <div
      className={cn("mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1", className)}
    >
      <h2 className="text-[0.9375rem] font-semibold text-foreground">{title}</h2>
      {aside ? <div className="text-xs text-muted-foreground">{aside}</div> : null}
    </div>
  )
}
