import type { ReactNode } from "react"

import { cn } from "@/website/lib/utils"

type InfoCardProps = {
  /** Small gold label or number above the title. */
  label?: ReactNode
  title: ReactNode
  children?: ReactNode
  /** `serif` = large display title (Vision / Mission cards); `sans` = small bold title. */
  titleStyle?: "serif" | "sans"
  className?: string
}

/** The standard bordered card: label, title, body. */
export function InfoCard({
  label,
  title,
  children,
  titleStyle = "sans",
  className,
}: InfoCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      {label ? <div className="kicker">{label}</div> : null}
      <h3
        className={cn(
          label && "mt-3",
          titleStyle === "serif"
            ? "font-display text-[1.625rem] leading-tight font-normal"
            : "text-[0.9375rem] font-bold",
        )}
      >
        {title}
      </h3>
      {children ? (
        <div className="mt-2.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {children}
        </div>
      ) : null}
    </div>
  )
}
