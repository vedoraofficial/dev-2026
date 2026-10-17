import type { ComponentProps } from "react"

import { Input } from "@/website/components/ui/input"
import { cn } from "@/website/lib/utils"

/** Mobile number field with a fixed "+91" prefix. */
export function PhoneInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted-foreground">
        +91
      </span>
      <Input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        className={cn("pl-12", className)}
        {...props}
      />
    </div>
  )
}
