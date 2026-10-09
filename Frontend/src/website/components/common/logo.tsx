import { cn } from "@/website/lib/utils"

/** Gold diamond + VEDORA wordmark (same mark as the partner portal). */
export function Logo({ className, tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center">
        <span className="size-5.5 rotate-45 rounded-[5px] bg-gold" />
      </span>
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
