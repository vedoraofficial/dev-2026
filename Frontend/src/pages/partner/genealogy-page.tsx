import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { partnerTree, type PartnerTreeMember } from "@/features/genealogy/mock-data"
import { formatBV, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const me = partnerTree

function flatten(member: PartnerTreeMember): PartnerTreeMember[] {
  return member.children.flatMap((c) => [c, ...flatten(c)])
}

const membersById = new Map(flatten(me).map((m) => [m.id, m]))

/** Row of children with the line dropping down from the parent card. */
const childRow =
  "relative flex justify-center pt-4 before:absolute before:top-0 before:left-1/2 before:h-4 before:w-px before:bg-gold/35"

/** One child: horizontal line joining its siblings + short vertical line down to its card. */
const branch =
  "relative flex flex-col items-center px-1 pt-4 before:absolute before:top-0 before:right-0 before:left-0 before:h-px before:bg-gold/35 first:before:left-1/2 last:before:right-1/2 only:before:hidden after:absolute after:top-0 after:left-1/2 after:h-4 after:w-px after:bg-gold/35"

/** How many members can be open at once. Older ones shrink to just the path you followed. */
const MAX_OPEN = 3
/** The tree goes down to Level 5, so a Level 5 member has nothing to open. */
const MAX_LEVEL = 5

/** Members shown in a team row before "+N more joined". */
const VISIBLE = 3

const canOpen = (m: PartnerTreeMember) => m.level < MAX_LEVEL && m.children.length > 0

type TreeProps = {
  openPath: string[]
  /** Members whose whole team row is shown (not just the first VISIBLE) */
  showAll: string[]
  selectedId: string
  onToggle: (member: PartnerTreeMember) => void
  onShowAll: (id: string) => void
}

/** Shows the rest of the team that has joined, or folds it back. */
function MoreCard({
  hidden,
  expanded,
  onClick,
}: {
  hidden: number
  expanded: boolean
  onClick: () => void
}) {
  return (
    <li className={branch}>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={expanded}
        className="flex w-28 flex-col items-center gap-1 rounded-xl border border-dashed border-gold/40 px-2 py-2.5 text-center text-gold hover:bg-gold/10"
      >
        {expanded ? <ChevronUp className="size-4" /> : <Plus className="size-4" />}
        <span className="text-[0.6875rem]">
          {expanded ? "Show less" : `+${hidden} more joined`}
        </span>
      </button>
    </li>
  )
}

/** A member's team: first VISIBLE members + "+N more joined", or only the child on the open path. */
function TeamRow({
  member,
  only,
  ...tree
}: TreeProps & { member: PartnerTreeMember; only?: string }) {
  const all = tree.showAll.includes(member.id)
  const list = only
    ? member.children.filter((c) => c.id === only)
    : member.children.filter((c, i) => all || i < VISIBLE || tree.openPath.includes(c.id))
  const hidden = member.children.length - list.length

  return (
    <ul className={childRow}>
      {list.map((c) => (
        <TreeBranch key={c.id} member={c} {...tree} />
      ))}
      {!only && (all || hidden > 0) ? (
        <MoreCard hidden={hidden} expanded={all} onClick={() => tree.onShowAll(member.id)} />
      ) : null}
    </ul>
  )
}

function MemberCard({
  member,
  open,
  selected,
  onToggle,
}: {
  member: PartnerTreeMember
  open: boolean
  selected: boolean
  onToggle: (member: PartnerTreeMember) => void
}) {
  const beyondCap = member.slot > 20
  const hasTeam = canOpen(member)
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <button
      type="button"
      data-member-id={member.id}
      onClick={() => onToggle(member)}
      aria-pressed={selected}
      aria-expanded={hasTeam ? open : undefined}
      className={cn(
        "w-28 rounded-xl border px-2 py-2.5 text-center transition-colors",
        beyondCap
          ? cn("border-dashed bg-danger-soft/20", selected ? "border-danger" : "border-danger/50")
          : cn("bg-card", selected ? "border-gold/60" : "border-border hover:border-gold/30"),
      )}
    >
      <MonoId tone="gold" className="text-[0.625rem]">
        {member.id}
      </MonoId>
      <p className="mt-0.5 truncate text-[0.8125rem] font-medium">{member.name}</p>
      <p
        className={cn(
          "mt-0.5 text-[0.625rem]",
          beyondCap ? "text-danger" : "text-muted-foreground",
        )}
      >
        {beyondCap
          ? `Slot ${member.slot} · no BV`
          : `L${member.level} · ${member.direct >= 20 ? "20 / 20 full" : `${member.direct} / 20`}`}
      </p>
      {hasTeam ? (
        <Chevron
          aria-hidden
          className={cn("mx-auto mt-1 size-3.5", open ? "text-gold" : "text-muted-foreground")}
        />
      ) : null}
    </button>
  )
}

function TreeBranch({ member, ...tree }: TreeProps & { member: PartnerTreeMember }) {
  const index = tree.openPath.indexOf(member.id)
  const open = index !== -1
  // Open members above the last MAX_OPEN keep only the child on the path, so the tree stays small.
  const shrunk = open && index < tree.openPath.length - MAX_OPEN

  return (
    <li className={branch}>
      <MemberCard
        member={member}
        open={open}
        selected={member.id === tree.selectedId}
        onToggle={tree.onToggle}
      />
      {open ? (
        <TeamRow member={member} only={shrunk ? tree.openPath[index + 1] : undefined} {...tree} />
      ) : null}
    </li>
  )
}

export function PartnerGenealogyPage() {
  const [selectedId, setSelectedId] = useState(me.children[1].id)
  const selected = membersById.get(selectedId) ?? me.children[0]
  const full = selected.direct >= 20

  /** Members whose team is open, top to bottom. You (the signed-in partner) are always open. */
  const [openPath, setOpenPath] = useState<string[]>([])
  const [showAll, setShowAll] = useState<string[]>([])

  const toggleShowAll = (id: string) =>
    setShowAll((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const toggle = (member: PartnerTreeMember) => {
    setSelectedId(member.id)
    setOpenPath((path) => {
      const i = path.indexOf(member.id)
      if (i !== -1 && i === path.length - 1) return path.slice(0, i) // close it
      if (i !== -1) return path.slice(0, i + 1) // show its whole team again
      // Opening a member closes whatever was open beside it at the same level.
      const above = path.slice(0, member.level - 1)
      return canOpen(member) ? [...above, member.id] : above
    })
  }

  // Keep the member you just opened in view — the tree can be wider than the screen.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const last = openPath[openPath.length - 1]
    if (!last) return
    scrollRef.current
      ?.querySelector(`[data-member-id="${last}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [openPath])

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
            <div
              ref={scrollRef}
              className="overflow-x-auto rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_0%,#0d2b1e_0%,transparent_70%)] p-4 md:p-6"
            >
              <div className="mx-auto flex w-max flex-col items-center">
                <div className="w-64 rounded-xl border border-gold/60 bg-card p-4 text-center shadow-[0_0_24px_-6px_rgba(201,169,97,0.35)]">
                  <MonoId tone="gold" className="text-[0.6875rem]">
                    {me.id}
                  </MonoId>
                  <p className="mt-1 font-medium">{me.fullName} — You</p>
                  <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                    {me.direct} / 20 direct ·{" "}
                    <span className="text-gold">{me.downline} downline</span>
                  </p>
                </div>

                <TeamRow
                  member={me}
                  openPath={openPath}
                  showAll={showAll}
                  selectedId={selectedId}
                  onToggle={toggle}
                  onShowAll={toggleShowAll}
                />
              </div>
            </div>

            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.6875rem] text-muted-foreground">
              <li className="flex items-center gap-2">
                <ChevronDown className="size-3.5" /> Click a member to open their team
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-[2px] bg-gold" /> BV-eligible placement
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-[2px] border border-dashed border-danger" />{" "}
                Beyond 20 slots — valid in tree, no BV income
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2.5 rounded-[2px] border border-dashed border-gold" /> + more
                joined — click to see everyone
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
