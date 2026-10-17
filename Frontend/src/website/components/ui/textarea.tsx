import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Same field look as Input; 16px on phones so iOS Safari doesn't zoom on focus
        "flex field-sizing-content min-h-28 w-full rounded-xl border border-input bg-field px-3.5 py-3 text-[16px] transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:border-gold/60 focus-visible:ring-3 focus-visible:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
