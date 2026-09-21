import { cn } from "@/lib/utils"

/** Gold diamond + VEDORA wordmark, used in the sidebar. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span aria-hidden className="grid size-9 shrink-0 place-items-center">
        <span className="size-6 rotate-45 rounded-[6px] bg-gold" />
      </span>
      <span className="flex flex-col">
        <span className="font-display text-[1.375rem] leading-none tracking-[0.32em] text-foreground">
          VEDORA
        </span>
        <span className="mt-1 text-[0.5rem] tracking-[0.3em] text-gold uppercase">
          Wear your energy
        </span>
      </span>
    </div>
  )
}
