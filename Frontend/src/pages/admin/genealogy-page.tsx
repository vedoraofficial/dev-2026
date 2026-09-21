import { useState } from "react"

import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { founderLegs, treeFooter } from "@/features/genealogy/mock-data"
import { formatBV, formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function AdminGenealogyPage() {
  const [selectedId, setSelectedId] = useState(founderLegs[0].id)
  const selected = founderLegs.find((f) => f.id === selectedId) ?? founderLegs[0]
  const full = selected.slotsUsed >= 20

  return (
    <>
      <PageHeader
        title="Genealogy Viewer"
        subtitle="Root Admin view · whole network from VED108 downward"
        actions={
          <>
            <Input
              defaultValue="VED108"
              aria-label="Jump to VEDORA ID"
              className="w-full font-mono uppercase md:w-52"
            />
            <Button variant="outline">Jump to ID</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_0%,#0d2b1e_0%,transparent_70%)] p-4 md:p-6">
              {/* Root */}
              <div className="mx-auto max-w-xs rounded-xl border border-gold/60 bg-card p-4 text-center shadow-[0_0_24px_-6px_rgba(201,169,97,0.35)]">
                <MonoId tone="gold" className="text-[0.6875rem]">
                  VED108
                </MonoId>
                <p className="mt-1 font-medium">Root Admin</p>
                <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                  Control &amp; oversight only · earns no income
                </p>
              </div>

              <div className="mx-auto hidden h-6 w-px bg-gold/35 md:block" />
              <div className="mx-[16.66%] hidden h-px bg-gold/35 md:block" />

              <div className="mt-5 grid gap-5 md:mt-0 md:grid-cols-3">
                {founderLegs.map((leg) => (
                  <div key={leg.id} className="flex min-w-0 flex-col gap-2.5">
                    <div className="mx-auto hidden h-6 w-px bg-gold/35 md:block" />
                    <button
                      type="button"
                      onClick={() => setSelectedId(leg.id)}
                      aria-pressed={leg.id === selectedId}
                      className={cn(
                        "rounded-xl border bg-card p-4 text-center transition-colors",
                        leg.id === selectedId
                          ? "border-gold/60"
                          : "border-border hover:border-gold/30",
                      )}
                    >
                      <MonoId tone="gold" className="text-[0.6875rem]">
                        {leg.id}
                      </MonoId>
                      <p className="mt-1 font-medium">{leg.name}</p>
                      <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                        {leg.slotsUsed} / 20 · {formatNumber(leg.downline)} downline
                      </p>
                    </button>
                    {leg.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/70 px-3.5 py-3"
                      >
                        <MonoId>{child.id}</MonoId>
                        <span className="text-[0.6875rem] text-muted-foreground">
                          {child.team} team
                        </span>
                      </div>
                    ))}
                    <div className="rounded-lg border border-dashed border-border px-3.5 py-3 text-center text-[0.6875rem] text-muted-foreground">
                      + {leg.moreChildren} more
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-[0.6875rem] text-muted-foreground">
              <p>
                Depth shown: {treeFooter.depthShown} of unlimited · Total nodes:{" "}
                {formatNumber(treeFooter.totalNodes)} · Widest level: {treeFooter.widestLevel} (hard
                cap)
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="quiet" size="sm">
                  Collapse all
                </Button>
                <Button variant="quiet" size="sm">
                  Expand 5 levels
                </Button>
                <Button variant="outline" size="sm">
                  Export tree
                </Button>
              </div>
            </div>
          </div>

          {/* Selected node */}
          <aside
            aria-label="Selected node"
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 md:p-5"
          >
            <p className="mb-4 eyebrow">Selected node</p>
            <div className="mb-5 flex items-center gap-3">
              <PersonAvatar tone="gold" size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium">{selected.name}</p>
                <p className="text-[0.6875rem]">
                  <MonoId tone="muted">{selected.id}</MonoId>
                  <span className="text-muted-foreground"> · Founder</span>
                </p>
              </div>
            </div>

            <dl className="space-y-3 border-t border-border/70 pt-4 text-[0.8125rem]">
              <Row label="Upline" value={<MonoId>VED108</MonoId>} />
              <Row
                label="Direct slots"
                value={
                  <span className={cn("font-mono", full && "text-danger")}>
                    {selected.slotsUsed} / 20{full ? " full" : ""}
                  </span>
                }
              />
              <Row label="Total downline" value={`${formatNumber(selected.downline)} partners`} />
              <Row label="Deepest level" value={selected.deepestLevel} />
              <Row
                label="BV under this leg"
                value={<span className="font-mono text-gold">{formatBV(selected.bvUnderLeg)}</span>}
              />
              <Row
                label="Income earned"
                value={
                  <span className="font-mono text-success">{formatINR(selected.incomeEarned)}</span>
                }
              />
              <Row label="Status" value={<StatusPill variant="success">Active</StatusPill>} />
            </dl>

            <p className="mt-5 rounded-xl border border-border bg-field/60 p-3.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
              Founder IDs are permanent. Placement, ID and sponsor cannot be reassigned — only
              status and profile data are editable.
            </p>

            <div className="mt-5 space-y-2 xl:mt-auto xl:pt-5">
              <Button size="lg" className="w-full">
                Open this node&apos;s tree
              </Button>
              <Button variant="outline" size="lg" className="w-full">
                View income report
              </Button>
              <Button variant="quiet" size="lg" className="w-full">
                Place partner under this ID
              </Button>
            </div>
          </aside>
        </div>
      </PageBody>
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
