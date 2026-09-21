import { useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Props = {
  /** Shown before the value, e.g. "Level" -> "Level: Any" */
  label: string
  options: string[]
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function FilterSelect({ label, options, defaultValue, onValueChange, className }: Props) {
  const [value, setValue] = useState(defaultValue ?? options[0])

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onValueChange?.(next)
      }}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-10 rounded-xl border-border bg-transparent px-3 text-xs data-[size=default]:h-10 md:h-9 md:data-[size=default]:h-9",
          className,
        )}
      >
        <SelectValue>
          <span className="text-muted-foreground">{label}:</span> {value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
