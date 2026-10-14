import type { Founder } from "@/website/features/about/content"

/** Name card: role label, name and (for founders) their VEDORA ID. No photos. */
export function FounderCard({ founder }: { founder: Founder }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <span className="inline-block rounded-full border border-gold/50 bg-gold/10 px-2.5 py-0.5 text-[0.625rem] font-bold tracking-[0.14em] text-gold uppercase">
        {founder.role}
      </span>
      <h3 className="mt-3 font-display text-[1.5rem] leading-tight font-normal">{founder.name}</h3>
      {founder.id ? (
        <p className="mt-1 font-mono text-[0.6875rem] font-semibold text-gold">{founder.id}</p>
      ) : null}
    </div>
  )
}
