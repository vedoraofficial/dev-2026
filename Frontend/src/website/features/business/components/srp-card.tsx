import { SRP_PER_MONTH, SRP_PER_SALE, SRP_STEPS } from "@/website/features/business/plan"

/** Sales Reward Points explainer with the SRP -> months ladder. */
export function SrpCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[1.0625rem] font-bold">Sales Reward Points (SRP)</h3>
        <span className="text-[0.6875rem] font-semibold text-gold">
          {SRP_PER_SALE} SRP per sale
        </span>
      </div>
      <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
        Every confirmed sale earns {SRP_PER_SALE} SRP. In a month with no sale, {SRP_PER_MONTH} SRP
        is used automatically to keep your ID active.
      </p>
      <div className="mt-5 grid grid-cols-5 gap-2">
        {SRP_STEPS.map((s) => (
          <div
            key={s.srp}
            className="rounded-lg border border-border bg-background/60 px-1 py-3 text-center"
          >
            <p className="font-mono text-[0.9375rem]">{s.srp}</p>
            <p className="mt-0.5 text-[0.625rem] text-muted-foreground">{s.months} mo</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[0.6875rem] text-muted-foreground">
        SRP needed → months of free activation
      </p>
    </div>
  )
}
