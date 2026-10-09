import type { ReactNode } from "react"

import { cn } from "@/website/lib/utils"

type CtaPanelProps = {
  title: ReactNode
  description?: ReactNode
  actions: ReactNode
  size?: "default" | "compact"
  className?: string
}

/** Bordered green panel with copy on the left and buttons on the right. */
export function CtaPanel({
  title,
  description,
  actions,
  size = "default",
  className,
}: CtaPanelProps) {
  const compact = size === "compact"
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-border bg-linear-to-br from-card to-background md:flex-row md:items-center md:justify-between",
        compact ? "p-5 md:px-6" : "p-7 md:p-12",
        className,
      )}
    >
      <div>
        <h2
          className={cn(
            compact
              ? "text-[0.9375rem] font-semibold"
              : "font-display text-[2rem] leading-[1.1] font-normal md:text-[2.5rem]",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("text-muted-foreground", compact ? "mt-1 text-xs" : "mt-4 text-sm")}>
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
    </div>
  )
}
