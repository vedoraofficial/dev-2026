import { cn } from "@/website/lib/utils"

/** The small rotated gold square used as a bullet throughout the design. */
export function GoldDiamond({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-1.5 shrink-0 rotate-45 bg-gold", className)}
    />
  )
}
