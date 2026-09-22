import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { GenealogyLegend, GenealogyTree, indexTree } from "@/components/common/genealogy-tree"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { adminTree, type TreeMember } from "@/features/genealogy/mock-data"
import { formatBV, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const root = adminTree
const membersById = indexTree(root)

export function AdminGenealogyPage() {
  const [searchParams] = useSearchParams()
  const requestedId = searchParams.get("id")

  const [selectedId, setSelectedId] = useState(
    (requestedId && membersById.has(requestedId) ? requestedId : root.children[0].id) as string,
  )
  // Jumped here from "Open genealogy" on a Founder's card — re-select when `?id=` changes,
  // without an effect (React's documented pattern for adjusting state during render).
  const [syncedId, setSyncedId] = useState(requestedId)
  if (requestedId !== syncedId) {
    setSyncedId(requestedId)
    if (requestedId && membersById.has(requestedId)) setSelectedId(requestedId)
  }

  // Which node the tree is currently rooted at — "View this node's tree" drills into it.
  const [viewRootId, setViewRootId] = useState(root.id)
  const viewRoot = membersById.get(viewRootId) ?? root
  const isWholeNetwork = viewRootId === root.id

  const selected = membersById.get(selectedId) ?? root.children[0]
  const full = selected.direct >= 20
  const isRoot = selected.id === root.id

  return (
    <>
      <PageHeader
        title="Genealogy Viewer"
        subtitle="Root Admin view · whole network from VED108 downward"
      />
      <PageBody>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-5">
            {isWholeNetwork ? null : (
              <Button variant="quiet" size="sm" onClick={() => setViewRootId(root.id)}>
                <ArrowLeft /> Back to whole network
              </Button>
            )}
            <GenealogyTree
              key={viewRoot.id}
              root={viewRoot}
              rootLabel={isWholeNetwork ? "Root Admin" : viewRoot.fullName}
              selectedId={selectedId}
              onSelect={(m: TreeMember) => setSelectedId(m.id)}
            />
            <GenealogyLegend />
          </div>

          <aside
            aria-label="Selected node"
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 md:p-5"
          >
            <p className="mb-4 eyebrow">Selected node</p>
            <div className="mb-5 flex items-center gap-3">
              <PersonAvatar tone={isRoot || selected.level === 1 ? "gold" : "plain"} size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {isRoot ? "Root Admin" : selected.fullName}
                  {selected.level === 1 ? " · Founder" : ""}
                </p>
                <MonoId tone="gold" className="text-[0.6875rem]">
                  {selected.id}
                </MonoId>
              </div>
            </div>

            {isRoot ? (
              <p className="border-t border-border/70 pt-4 text-[0.8125rem] text-muted-foreground">
                Control &amp; oversight only — Root Admin earns no income and sits above the
                network.
              </p>
            ) : (
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
                  label="BV under this leg"
                  value={
                    <span className="font-mono text-gold">{formatBV(selected.bvContributed)}</span>
                  }
                />
                <Row label="Status" value={<StatusPill variant="success">Active</StatusPill>} />
              </dl>
            )}

            <Button
              variant="outline"
              size="lg"
              className="mt-5 w-full xl:mt-auto"
              disabled={selected.id === viewRootId}
              onClick={() => {
                setViewRootId(selected.id)
                toast.success(`Viewing ${isRoot ? "Root Admin" : selected.fullName}'s tree`)
              }}
            >
              View this node&apos;s tree
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
