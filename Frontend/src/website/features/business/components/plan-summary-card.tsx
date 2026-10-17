import { PLAN, PLAN_LEVELS } from "@/website/features/business/plan"
import { formatBV, formatINR } from "@/website/lib/format"

function Row({ label, amount, share }: { label: string; amount: number; share: number }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 py-2 sm:grid-cols-[7.5rem_1fr_3.5rem]">
      <span className="text-[0.75rem] text-muted-foreground">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-forest">
        <span
          className="block h-full rounded-full bg-gold"
          style={{ width: `${share * 100}%`, opacity: 0.45 + share * 0.55 }}
        />
      </span>
      <span className="text-right font-mono text-[0.75rem]">{formatINR(amount)}</span>
    </div>
  )
}

/** "How the plan works" — per-sale payout bars on the home page. */
export function PlanSummaryCard() {
  const max = PLAN.directIncome
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center justify-between border-b border-border pb-3 text-[0.75rem]">
        <span className="text-muted-foreground">One bracelet · {formatINR(PLAN.price)}</span>
        <span className="font-mono text-gold">{formatBV(PLAN.bvPerSale)}</span>
      </div>
      <div className="py-2">
        <Row label="Direct sale" amount={PLAN.directIncome} share={1} />
        {PLAN_LEVELS.map((l) => (
          <Row
            key={l.level}
            label={`Level ${l.level} · ${l.percent}%`}
            amount={l.amount}
            share={l.amount / max}
          />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-[0.8125rem] font-bold">Distributed per sale</span>
        <span className="font-display text-[1.75rem] leading-none text-gold">
          {formatINR(PLAN.totalPerSale)}
        </span>
      </div>
    </div>
  )
}
