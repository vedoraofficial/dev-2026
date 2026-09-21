import { Plus } from "lucide-react"
import { useState } from "react"

import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { partnerTree } from "@/features/genealogy/mock-data"
import { formatBV, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const { me, children } = partnerTree

export function PartnerGenealogyPage() {
  const [selectedId, setSelectedId] = useState(children[1].id)
  const selected = children.find((c) => c.id === selectedId) ?? children[0]
  const full = selected.direct >= 20

  return (
    <>
      <PageHeader
        title="Genealogy Tree"
        subtitle={
          <>
            Your downline from <MonoId tone="gold">{me.id}</MonoId>
          </>
        }
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button>Place new partner</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_0%,#0d2b1e_0%,transparent_70%)] p-4 md:p-6">
              <div className="mx-auto max-w-xs rounded-xl border border-gold/60 bg-card p-4 text-center shadow-[0_0_24px_-6px_rgba(201,169,97,0.35)]">
                <MonoId tone="gold" className="text-[0.6875rem]">
                  {me.id}
                </MonoId>
                <p className="mt-1 font-semibold">{me.name} — You</p>
                <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                  {me.direct} / 20 direct ·{" "}
                  <span className="text-gold">{me.downline} downline</span>
                </p>
              </div>

              <div className="mx-auto hidden h-6 w-px bg-gold/35 md:block" />
              <div className="mx-[12.5%] hidden h-px bg-gold/35 md:block" />

              <div className="mt-5 grid grid-cols-2 gap-3 md:mt-0 md:grid-cols-4 md:gap-4">
                {children.map((c) => (
                  <div key={c.id} className="flex min-w-0 flex-col gap-2.5">
                    <div className="mx-auto hidden h-6 w-px bg-gold/35 md:block" />
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-pressed={c.id === selectedId}
                      className={cn(
                        "rounded-xl border bg-card p-3.5 text-center transition-colors",
                        c.id === selectedId
                          ? "border-gold/60"
                          : "border-border hover:border-gold/30",
                      )}
                    >
                      <MonoId tone="gold" className="text-[0.625rem]">
                        {c.id}
                      </MonoId>
                      <p className="mt-1 font-semibold">{c.name}</p>
                      <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                        {c.direct >= 20 ? "20 / 20 · full" : `${c.direct} / 20 direct`}
                      </p>
                    </button>
                    {c.children.map((g) => (
                      <div
                        key={g.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5",
                          g.note === "beyond-cap"
                            ? "border-dashed border-danger/50 bg-danger-soft/20"
                            : "border-border bg-card/70",
                        )}
                      >
                        <MonoId className="text-[0.625rem]">{g.id}</MonoId>
                        <span
                          className={cn(
                            "text-[0.625rem]",
                            g.note === "beyond-cap" ? "text-danger" : "text-muted-foreground",
                          )}
                        >
                          {g.note === "beyond-cap" ? "21st · no BV" : `L${g.level}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="flex min-w-0 flex-col gap-2.5">
                  <div className="mx-auto hidden h-6 w-px bg-gold/35 md:block" />
                  <button
                    type="button"
                    className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-gold/40 p-3.5 text-center text-gold hover:bg-gold/10"
                  >
                    <Plus className="size-4" />
                    <span className="text-[0.6875rem]">Slot {partnerTree.openSlot} open</span>
                  </button>
                </div>
              </div>
            </div>

            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.6875rem] text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-[2px] bg-gold" /> BV-eligible placement
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-[2px] border border-dashed border-danger" />{" "}
                Beyond 20 slots — valid in tree, no BV income
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-[2px] border border-dashed border-gold" /> Open
                slot
              </li>
            </ul>
          </div>

          <aside
            aria-label="Selected member"
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 md:p-5"
          >
            <p className="mb-4 eyebrow">Selected member</p>
            <div className="mb-5 flex items-center gap-3">
              <PersonAvatar size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{selected.fullName}</p>
                <MonoId tone="gold" className="text-[0.6875rem]">
                  {selected.id}
                </MonoId>
              </div>
            </div>

            <dl className="space-y-3 border-t border-border/70 pt-4 text-[0.8125rem]">
              <Row label="Sponsor" value={<MonoId>{selected.sponsor}</MonoId>} />
              <Row label="Joined" value={selected.joined} />
              <Row
                label="Direct slots"
                value={
                  <span className={cn("font-mono", full && "text-danger")}>
                    {selected.direct} / 20{full ? " full" : ""}
                  </span>
                }
              />
              <Row label="Downline" value={`${formatNumber(selected.downline)} partners`} />
              <Row
                label="BV contributed"
                value={
                  <span className="font-mono text-gold">{formatBV(selected.bvContributed)}</span>
                }
              />
              <Row label="Status" value={<StatusPill variant="success">Active</StatusPill>} />
            </dl>

            {full ? (
              <p className="mt-5 rounded-xl border border-border bg-field/60 p-3.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
                All 20 BV-eligible slots under this ID are taken. Further partners can be placed
                manually by Admin but will not generate BV level income for this sponsor.
              </p>
            ) : null}

            <Button variant="outline" size="lg" className="mt-5 w-full xl:mt-auto">
              View this member&apos;s tree
            </Button>
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
