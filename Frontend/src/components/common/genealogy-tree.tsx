import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { MonoId } from "@/components/common/mono-id"
import type { TreeMember } from "@/features/genealogy/mock-data"
import { cn } from "@/lib/utils"

/** Every node under `root`, flattened (root itself excluded). */
function flatten(member: TreeMember): TreeMember[] {
  return member.children.flatMap((c) => [c, ...flatten(c)])
}

/** Builds an id → node lookup for a tree, root included — for the "selected member" panel. */
export function indexTree(root: TreeMember): Map<string, TreeMember> {
  return new Map([root, ...flatten(root)].map((m) => [m.id, m]))
}

/** Row of children with the line dropping down from the parent card. */
const childRow =
  "relative flex justify-center pt-4 before:absolute before:top-0 before:left-1/2 before:h-4 before:w-px before:bg-gold/35"

/** One child: horizontal line joining its siblings + short vertical line down to its card. */
const branch =
  "relative flex flex-col items-center px-1 pt-4 before:absolute before:top-0 before:right-0 before:left-0 before:h-px before:bg-gold/35 first:before:left-1/2 last:before:right-1/2 only:before:hidden after:absolute after:top-0 after:left-1/2 after:h-4 after:w-px after:bg-gold/35"

/** How many members can be open at once. Older ones shrink to just the path you followed. */
const MAX_OPEN = 3
/** Sample trees are generated down to Level 5 — nothing deeper to open past that. */
const MAX_LEVEL = 5
/** Members shown in a team row before "+N more". */
const VISIBLE = 3

const canOpen = (m: TreeMember) => m.level < MAX_LEVEL && m.children.length > 0

type TreeState = {
  openPath: string[]
  /** Members whose whole team row is shown (not just the first VISIBLE) */
  showAll: string[]
  selectedId: string
  onToggle: (member: TreeMember) => void
  onShowAll: (id: string) => void
}

/** Reveals the rest of a team that has joined, or folds it back. */
function MoreCard({
  hidden,
  expanded,
  onClick,
  label = "more joined",
}: {
  hidden: number
  expanded: boolean
  onClick: () => void
  label?: string
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
        <span className="text-[0.6875rem]">{expanded ? "Show less" : `+${hidden} ${label}`}</span>
      </button>
    </li>
  )
}

/** A member's team: first VISIBLE members + "+N more", or only the child on the open path. */
function TeamRow({ member, only, ...tree }: TreeState & { member: TreeMember; only?: string }) {
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
  member: TreeMember
  open: boolean
  selected: boolean
  onToggle: (member: TreeMember) => void
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

function TreeBranch({ member, ...tree }: TreeState & { member: TreeMember }) {
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

type GenealogyTreeProps = {
  root: TreeMember
  /** Text on the root's own (non-clickable) card, e.g. "Rohit Deshmukh — You" or "Root Admin". */
  rootLabel: string
  selectedId: string
  onSelect: (member: TreeMember) => void
}

/**
 * An expandable genealogy tree: click a member to open their team (closing whatever else was
 * open at that level), "+N more" reveals the rest of a big team, and the tree scrolls the
 * member you just opened into view. Shared by the Partner and Admin genealogy screens.
 */
export function GenealogyTree({ root, rootLabel, selectedId, onSelect }: GenealogyTreeProps) {
  const [openPath, setOpenPath] = useState<string[]>([])
  const [showAll, setShowAll] = useState<string[]>([])

  const toggleShowAll = (id: string) =>
    setShowAll((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const toggle = (member: TreeMember) => {
    onSelect(member)
    setOpenPath((path) => {
      const i = path.indexOf(member.id)
      if (i !== -1 && i === path.length - 1) return path.slice(0, i) // close it
      if (i !== -1) return path.slice(0, i + 1) // show its whole team again
      // Opening a member closes whatever was open beside it at the same level.
      const above = path.slice(0, member.level - root.level - 1)
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
    <div
      ref={scrollRef}
      className="overflow-x-auto rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_0%,#0d2b1e_0%,transparent_70%)] p-4 md:p-6"
    >
      <div className="mx-auto flex w-max flex-col items-center">
        <div className="w-64 rounded-xl border border-gold/60 bg-card p-4 text-center shadow-[0_0_24px_-6px_rgba(201,169,97,0.35)]">
          <MonoId tone="gold" className="text-[0.6875rem]">
            {root.id}
          </MonoId>
          <p className="mt-1 font-medium">{rootLabel}</p>
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">
            {root.direct} / 20 direct · <span className="text-gold">{root.downline} downline</span>
          </p>
        </div>

        <TeamRow
          member={root}
          openPath={openPath}
          showAll={showAll}
          selectedId={selectedId}
          onToggle={toggle}
          onShowAll={toggleShowAll}
        />
      </div>
    </div>
  )
}

/** The legend row shown under every GenealogyTree. */
export function GenealogyLegend() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.6875rem] text-muted-foreground">
      <li className="flex items-center gap-2">
        <ChevronDown className="size-3.5" /> Click a member to open their team
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-[2px] bg-gold" /> BV-eligible placement
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-[2px] border border-dashed border-danger" /> Beyond 20
        slots — valid in tree, no BV income
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-[2px] border border-dashed border-gold" /> + more — click
        to see everyone
      </li>
    </ul>
  )
}
