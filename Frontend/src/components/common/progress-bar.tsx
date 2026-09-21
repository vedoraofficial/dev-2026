import { cn } from "@/lib/utils"

type Props = {
  value: number
  max?: number
  label?: string
  className?: string
  barClassName?: string
}

export function ProgressBar({ value, max = 100, label, className, barClassName }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-forest/70", className)}
    >
      <div
        className={cn("h-full rounded-full bg-gold", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
