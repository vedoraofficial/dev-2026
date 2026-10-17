import type { ReactNode } from "react"

import { Label } from "@/website/components/ui/label"
import { cn } from "@/website/lib/utils"

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-danger">
      {message}
    </p>
  ) : null
}

/** Label + control + validation message — the layout every form in the app uses. */
export function FormField({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <Label htmlFor={htmlFor} className="site-eyebrow">
        {label}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  )
}
