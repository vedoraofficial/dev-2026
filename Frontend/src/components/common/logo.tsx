import mark from "@/assets/images/vedora-logo-mark.jpg"
import { cn } from "@/lib/utils"

/** The VEDORA logo (gold V + wordmark on cream) with the name beside it, in the sidebar's top-left corner. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={mark}
        alt=""
        width={640}
        height={398}
        className="h-12 w-auto shrink-0 rounded-lg border border-gold/50 shadow-[0_6px_14px_-8px_#00000080]"
      />
      <span className="font-display text-[1.375rem] leading-none tracking-[0.28em] text-foreground">
        VEDORA
      </span>
    </div>
  )
}
