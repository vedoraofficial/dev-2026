import { useState } from "react"

import { GenealogyLegend, GenealogyTree, indexTree } from "@/components/common/genealogy-tree"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { partnerTree, type TreeMember } from "@/features/genealogy/mock-data"
import { formatBV, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const me = partnerTree
const membersById = indexTree(me)

export function PartnerGenealogyPage() {
  const [selectedId, setSelectedId] = useState(me.children[1].id)
  const selected = membersById.get(selectedId) ?? me.children[0]
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-5">
            <GenealogyTree
              root={me}
              rootLabel={`${me.fullName} — You`}
              selectedId={selectedId}
              onSelect={(m: TreeMember) => setSelectedId(m.id)}
            />
            <GenealogyLegend />
          </div>

          <aside
            aria-label="Selected member"
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 md:p-5"
          >
            <p className="mb-4 eyebrow">Selected member</p>
            <div className="mb-5 flex items-center gap-3">
              <PersonAvatar size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium">{selected.fullName}</p>
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
