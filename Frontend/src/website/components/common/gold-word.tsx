import type { ReactNode } from "react"

import { cn } from "@/website/lib/utils"

/**
 * The accent word of a hero title ("Energy", "quality."): gold gradient italics with a
 * hand-drawn gold stroke under it, and an optional small star at its top-right.
 */
export function GoldWord({
  children,
  sparkle = false,
  className,
}: {
  children: ReactNode
  sparkle?: boolean
  className?: string
}) {
  return (
    <em className={cn("relative inline-block pr-[0.12em] pb-[0.2em]", className)}>
      <span className="bg-linear-to-r from-gold-light via-gold to-gold-light bg-clip-text text-transparent">
        {children}
      </span>
      <svg
        aria-hidden
        viewBox="0 0 240 20"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-[0.18em] w-full"
      >
        <path
          d="M3 14C60 5 150 2 237 9"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {sparkle ? (
        <span aria-hidden className="absolute -top-[0.05em] -right-[0.3em] text-[0.35em] text-gold">
          ✦
        </span>
      ) : null}
    </em>
  )
}
