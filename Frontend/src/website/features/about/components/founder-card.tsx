import type { Founder } from "@/website/features/about/content"

/** Photo (or striped placeholder), VEDORA ID, name and role. */
export function FounderCard({ founder }: { founder: Founder }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {founder.photo ? (
        <img
          src={founder.photo}
          alt={founder.name}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="grid aspect-square place-items-center photo-placeholder">
          <span className="font-mono text-[0.6875rem] text-muted-foreground">founder photo</span>
        </div>
      )}
      <div className="p-5">
        <p className="font-mono text-[0.6875rem] font-semibold text-gold">{founder.id}</p>
        <h3 className="mt-1.5 font-display text-[1.5rem] leading-tight font-normal">
          {founder.name}
        </h3>
        <p className="mt-0.5 text-[0.75rem] text-muted-foreground">{founder.role}</p>
      </div>
    </div>
  )
}
