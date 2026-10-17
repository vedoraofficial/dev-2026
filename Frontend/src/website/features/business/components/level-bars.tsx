import { PLAN, PLAN_LEVELS } from "@/website/features/business/plan"
import { formatINR } from "@/website/lib/format"
import { cn } from "@/website/lib/utils"

/** Bar colours fade from gold (you) to olive (level 5). */
const barTone = ["bg-chart-1", "bg-chart-2", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

/** Bar widths — the team widens with every level below you (illustrative, not to scale). */
const barWidth = [8, 36, 52, 68, 84, 100]

/** "How your team is structured" — a widening bar per level. */
export function LevelBars() {
  const rows = [
    { label: "You", note: `${formatINR(PLAN.directIncome)} + L1` },
    ...PLAN_LEVELS.map((l) => ({
      label: `Level ${l.level}`,
      note: `${l.percent}% · ${formatINR(l.amount)}`,
    })),
  ]

  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="grid grid-cols-[4rem_1fr] items-center gap-3 sm:grid-cols-[5rem_1fr_7rem] md:gap-6"
        >
          <span className={cn("text-[0.8125rem] font-bold", i === 0 && "text-gold")}>
            {r.label}
          </span>
          <span className="block h-7 md:h-8">
            <span
              className={cn("block h-full rounded-sm", barTone[i])}
              style={{ width: `${barWidth[i]}%` }}
            />
          </span>
          <span className="col-start-2 -mt-1 text-[0.6875rem] text-muted-foreground sm:col-start-auto sm:mt-0 sm:text-right">
            {r.note}
          </span>
        </div>
      ))}
    </div>
  )
}
