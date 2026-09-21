import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type TimelineStep = { title: string; meta?: ReactNode; done: boolean }

/** Vertical progress list: gold dots for completed steps, hollow for what is still ahead. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol>
      {steps.map((step, i) => {
        const next = steps[i + 1]
        return (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {next ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-4 left-[5px] h-[calc(100%-0.25rem)] w-px",
                  step.done && next.done ? "bg-gold/60" : "bg-border",
                )}
              />
            ) : null}
            <span
              aria-hidden
              className={cn(
                "relative mt-1 size-[11px] shrink-0 rounded-full border",
                step.done ? "border-gold bg-gold" : "border-muted-foreground/50 bg-card",
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[0.8125rem] font-medium",
                  !step.done && "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              {step.meta ? (
                <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{step.meta}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
