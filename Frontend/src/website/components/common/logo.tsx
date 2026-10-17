import mark from "@/assets/images/vedora-logo-mark.jpg"
import { cn } from "@/website/lib/utils"

/** VEDORA logo (gold V on cream) with the wordmark beside it — header and footer. */
export function Logo({ className, tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <img
        src={mark}
        alt=""
        width={640}
        height={398}
        className="h-10 w-auto shrink-0 rounded-md border border-gold/40"
      />
      <span className="flex flex-col">
        <span className="font-display text-[1.25rem] leading-none tracking-[0.32em] text-foreground">
          VEDORA
        </span>
        {tagline ? (
          <span className="mt-1 text-[0.5rem] tracking-[0.3em] text-gold uppercase">
            Wear your energy
          </span>
        ) : null}
      </span>
    </span>
  )
}
