import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** VEDORA IDs, order numbers and other codes are always monospace. */
export function MonoId({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode
  tone?: "default" | "gold" | "muted"
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-mono text-[0.75rem] tracking-wide",
        tone === "gold" && "text-gold",
        tone === "muted" && "text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}
