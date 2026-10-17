import { GoldDiamond } from "@/website/components/common/gold-diamond"
import { cn } from "@/website/lib/utils"

/** A list with gold diamond bullets. */
export function BulletList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-baseline gap-3">
          <GoldDiamond className="-translate-y-px" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
