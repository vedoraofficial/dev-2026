import { useState } from "react"

import { cn } from "@/lib/utils"

type Tab = { value: string; label: string }

type Props = {
  tabs: Tab[]
  /** Controlled value. Leave out to let the component keep its own state. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  "aria-label"?: string
}

/** Pill-style filter tabs. Scrolls sideways on phones instead of wrapping. */
export function FilterTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
  "aria-label": ariaLabel = "Filter",
}: Props) {
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.value)
  const active = value ?? inner

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1", className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === active}
          onClick={() => {
            setInner(tab.value)
            onValueChange?.(tab.value)
          }}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors md:py-1.5",
            tab.value === active
              ? "bg-accent text-gold-light"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
