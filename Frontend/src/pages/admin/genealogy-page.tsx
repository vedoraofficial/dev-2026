import { ArrowLeft, Search } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useSearchParams } from "react-router-dom"

import { GenealogyLegend, GenealogyTree } from "@/components/common/genealogy-tree"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MemberPanel } from "@/features/genealogy/components/member-panel"
import type { TreeMember } from "@/features/genealogy/types"
import {
  FOUNDER_IDS,
  FOUNDER_NAMES,
  useGenealogyTree,
} from "@/features/genealogy/use-genealogy-tree"
import { useSession } from "@/lib/session"
import { normalizeVedId } from "@/lib/ved-id"

function blankMember(id: string, fullName: string, level: number, sponsor: string): TreeMember {
  return {
    id,
    name: fullName.split(" ")[0] ?? fullName,
    fullName,
    level,
    slot: 0,
    sponsor,
    joined: "—",
    direct: null,
    downline: null,
    bvContributed: null,
    openSlot: null,
    children: [],
    pending: true,
    status: "ACTIVE",
  }
}

export function AdminGenealogyPage() {
  const adminId = useSession((s) => s.user?.vedId) ?? "VED108"

  // Whole network: Root Admin → the 3 Founders → their teams, loaded as you open them.
  const [networkRoot] = useState<TreeMember>(() => ({
    ...blankMember(adminId, "Root Admin", 0, "—"),
    pending: false,
    children: FOUNDER_IDS.map((id, i) => ({
      ...blankMember(id, FOUNDER_NAMES[id] ?? id, 1, adminId),
      name: FOUNDER_NAMES[id] ?? id,
      slot: i + 1,
    })),
  }))
  const network = useGenealogyTree(networkRoot)

  // Any other ID typed in the search box gets its own tree.
  const [searchRoot, setSearchRoot] = useState<TreeMember | null>(null)
  const searched = useGenealogyTree(searchRoot)
  const [query, setQuery] = useState("")

  const [searchParams] = useSearchParams()
  const requestedId = searchParams.get("id")
  const [selectedId, setSelectedId] = useState(requestedId ?? FOUNDER_IDS[0])
  // Jumped here from "Open genealogy" on a Founder's card — re-select when `?id=` changes,
  // without an effect (React's documented pattern for adjusting state during render).
  const [syncedId, setSyncedId] = useState(requestedId)
  if (requestedId !== syncedId) {
    setSyncedId(requestedId)
    if (requestedId) setSelectedId(requestedId)
  }

  const [viewRootId, setViewRootId] = useState(adminId)
  const active = searchRoot ? searched : network
  const viewRoot = active.index.get(viewRootId) ?? active.tree ?? network.tree!
  const isWholeNetwork = !searchRoot && viewRootId === adminId

  const selected = active.index.get(selectedId) ?? viewRoot
  const isRoot = selected.id === adminId

  const select = (m: TreeMember) => {
    setSelectedId(m.id)
    void active.loadTeam(m)
  }

  const backToNetwork = () => {
    setSearchRoot(null)
    setViewRootId(adminId)
  }

  const search = (e: FormEvent) => {
    e.preventDefault()
    const id = normalizeVedId(query)
    if (!/^VED\d+$/.test(id)) return
    if (network.index.has(id)) {
      setSearchRoot(null)
      setViewRootId(id)
      setSelectedId(id)
      return
    }
    const root = blankMember(id, id, 0, "—")
    setSearchRoot(root)
    setViewRootId(id)
    setSelectedId(id)
    void searched.loadTeam(root)
  }

  return (
    <>
      <PageHeader
        title="Genealogy Viewer"
        subtitle={`Root Admin view · whole network from ${adminId} downward`}
        actions={
          <form onSubmit={search} className="flex gap-2" role="search">
            <Input
              aria-label="Find a VEDORA ID"
              placeholder="Find VEDORA ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-44 font-mono uppercase placeholder:normal-case"
            />
            <Button type="submit" variant="outline" aria-label="Show tree">
              <Search />
            </Button>
          </form>
        }
      />
      <PageBody>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-5">
            {isWholeNetwork ? null : (
              <Button variant="quiet" size="sm" onClick={backToNetwork}>
                <ArrowLeft /> Back to whole network
              </Button>
            )}
            <GenealogyTree
              key={viewRoot.id}
              root={viewRoot}
              rootLabel={isWholeNetwork ? "Root Admin" : viewRoot.fullName}
              selectedId={selectedId}
              onSelect={select}
            />
            <GenealogyLegend />
          </div>

          <MemberPanel
            title="Selected node"
            member={selected}
            displayName={
              isRoot
                ? "Root Admin"
                : `${selected.fullName}${selected.level === 1 && !searchRoot ? " · Founder" : ""}`
            }
            avatarTone={isRoot || selected.level === 1 ? "gold" : "plain"}
            note={
              isRoot
                ? "Control & oversight only — Root Admin earns no income and sits above the network."
                : undefined
            }
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              disabled={selected.id === viewRoot.id}
              onClick={() => {
                setViewRootId(selected.id)
                void active.loadTeam(selected)
              }}
            >
              View this node&apos;s tree
            </Button>
          </MemberPanel>
        </div>
      </PageBody>
    </>
  )
}
