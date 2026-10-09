import { PLAN, PLAN_LEVELS } from "@/website/features/business/plan"
import { formatINR } from "@/website/lib/format"

const row =
  "grid grid-cols-[1fr_5rem_4.5rem] items-center px-5 sm:grid-cols-[1fr_7rem_5rem] md:px-6"

/** Income / share of BV / per-sale table on the business page. */
export function IncomeTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-deep/60">
      <div className={`${row} border-b border-border py-4 site-eyebrow text-[0.625rem]`}>
        <span>Income</span>
        <span>Share of BV</span>
        <span className="text-right">Per sale</span>
      </div>
      <div className={`${row} border-b border-border py-4 text-[0.8125rem]`}>
        <span className="font-semibold">Direct sale</span>
        <span className="text-muted-foreground">—</span>
        <span className="text-right font-mono text-gold">{formatINR(PLAN.directIncome)}</span>
      </div>
      {PLAN_LEVELS.map((l) => (
        <div key={l.level} className={`${row} border-b border-border py-4 text-[0.8125rem]`}>
          <span className="font-semibold">Level {l.level}</span>
          <span className="font-mono text-muted-foreground">{l.percent}%</span>
          <span className="text-right font-mono text-gold">{formatINR(l.amount)}</span>
        </div>
      ))}
      <div className={`${row} py-5`}>
        <span className="text-[0.875rem] font-bold">Total distributed</span>
        <span className="font-mono text-[0.8125rem] text-muted-foreground">
          {PLAN.totalPercent}%
        </span>
        <span className="text-right font-display text-[1.75rem] leading-none text-gold">
          {formatINR(PLAN.totalPerSale)}
        </span>
      </div>
    </div>
  )
}
