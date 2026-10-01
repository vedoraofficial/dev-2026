import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { GenealogyLegend, GenealogyTree } from "@/components/common/genealogy-tree"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { MemberPanel } from "@/features/genealogy/components/member-panel"
import { useMyGenealogy, useMySlots } from "@/features/genealogy/queries"
import type { TreeMember } from "@/features/genealogy/types"
import {
  nextOpenSlot,
  toTreeMember,
  useGenealogyTree,
} from "@/features/genealogy/use-genealogy-tree"
import { combineQueries } from "@/lib/combine-queries"
import { downloadCsv } from "@/lib/csv"
import { formatDate } from "@/lib/date"
import { useSession } from "@/lib/session"

export function PartnerGenealogyPage() {
  const me = useSession((s) => s.user)
  const genealogy = useMyGenealogy()
  const slots = useMySlots()

  // My direct partners as the first row of the tree. The backend only lets Admin read other
  // IDs' teams, so the cards below me can't be opened further from here.
  const joinedAt = new Map(
    (slots.data?.filledSlots ?? []).map((f) => [f.partner.vedId, formatDate(f.partner.joinedAt)]),
  )
  const g = genealogy.data
  const root: TreeMember | null = g
    ? {
        id: g.user.vedId,
        name: g.user.name,
        fullName: g.user.name,
        level: 0,
        slot: g.node?.slotNumber ?? 0,
        sponsor: g.node?.parent?.vedId ?? "—",
        joined: "—",
        direct: g.directPartnersCount,
        downline: null,
        bvContributed: null,
        openSlot: nextOpenSlot(g.directPartners.map((p) => p.slotNumber)),
        status: g.user.status,
        children: g.directPartners.map((p) =>
          toTreeMember(p, { id: g.user.vedId, level: 0 }, { joined: joinedAt.get(p.vedId) }),
        ),
      }
    : null
  const { tree, index } = useGenealogyTree(root)

  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState(searchParams.get("id") ?? "")
  const selected = index.get(selectedId) ?? tree?.children[0] ?? tree

  const exportTeamCsv = () => {
    const rows = tree?.children ?? []
    downloadCsv(
      "vedora-my-team.csv",
      ["VEDORA ID", "Name", "Slot", "Joined", "Status"],
      rows.map((m) => [m.id, m.fullName, m.slot, m.joined, m.status ?? ""]),
    )
    toast.success(`Exported ${rows.length} team members`)
  }

  return (
    <>
      <PageHeader
        title="Genealogy Tree"
        subtitle={
          <>
            Your downline from <MonoId tone="gold">{me?.vedId}</MonoId>
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={exportTeamCsv} disabled={!tree?.children.length}>
              Export
            </Button>
            <Button asChild>
              <Link to={ROUTES.partner.manualPlacement}>Place new partner</Link>
            </Button>
          </>
        }
      />
      <PageBody>
        <QueryState query={combineQueries(genealogy, slots)} rows={6}>
          {tree && selected ? (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="min-w-0 space-y-5">
                <GenealogyTree
                  root={tree}
                  rootLabel={`${tree.fullName} — You`}
                  selectedId={selected.id}
                  onSelect={(m) => setSelectedId(m.id)}
                />
                <GenealogyLegend />
              </div>

              <MemberPanel
                title="Selected member"
                member={selected}
                displayName={selected.id === tree.id ? `${tree.fullName} — You` : undefined}
              >
                {selected.id === tree.id ? (
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link to={ROUTES.partner.manualPlacement}>
                      {tree.openSlot ? `Place partner in slot ${tree.openSlot}` : "All slots full"}
                    </Link>
                  </Button>
                ) : (
                  <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                    Deeper levels of your team aren&apos;t available from the server yet.
                  </p>
                )}
              </MemberPanel>
            </div>
          ) : null}
        </QueryState>
      </PageBody>
    </>
  )
}
