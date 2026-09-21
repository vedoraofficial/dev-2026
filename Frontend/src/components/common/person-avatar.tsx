import { cn } from "@/lib/utils"

const tones = {
  /** Default — green stripes with a gold ring */
  striped:
    "bg-[repeating-linear-gradient(135deg,var(--forest)_0_3px,var(--card)_3px_6px)] ring-1 ring-gold/35",
  /** Founders */
  gold: "bg-gold",
  /** Inactive / capped */
  muted: "bg-[#2a1c17] ring-1 ring-danger/20",
  plain: "bg-forest/70",
} as const

const sizes = { xs: "size-6", sm: "size-8", md: "size-10", lg: "size-14", xl: "size-24" } as const

type Props = {
  tone?: keyof typeof tones
  size?: keyof typeof sizes
  className?: string
}

export function PersonAvatar({ tone = "striped", size = "md", className }: Props) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full", tones[tone], sizes[size], className)}
    />
  )
}
