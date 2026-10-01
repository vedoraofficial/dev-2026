import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { getGenealogyOf } from "@/features/genealogy/api"
import { genealogyKeys } from "@/features/genealogy/queries"
import type { DirectPartner, TreeMember } from "@/features/genealogy/types"
import { apiErrorMessage } from "@/lib/api"

/** The three permanent Founders (seeded by the backend; they sit at the top, outside the tree). */
export const FOUNDER_IDS = ["VED000001", "VED000002", "VED000003"] as const

/** Names the backend seeds for them (there is no "get user by ID" API for Admin). */
export const FOUNDER_NAMES: Record<string, string> = {
  VED000001: "Founder One",
  VED000002: "Founder Two",
  VED000003: "Founder Three",
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name

/** A backend partner → a tree card. `canLoadTeam` marks it openable before its team is fetched. */
export function toTreeMember(
  p: Pick<DirectPartner, "vedId" | "name" | "slotNumber"> & Partial<DirectPartner>,
  parent: { id: string; level: number },
  extra: { canLoadTeam?: boolean; joined?: string } = {},
): TreeMember {
  return {
    id: p.vedId,
    name: firstName(p.name),
    fullName: p.name,
    level: parent.level + 1,
    slot: p.slotNumber,
    sponsor: parent.id,
    joined: extra.joined ?? "—",
    direct: null,
    downline: null,
    bvContributed: null,
    openSlot: null,
    children: [],
    pending: extra.canLoadTeam,
    status: p.status,
  }
}

/** Lowest free slot (1–20) given the occupied ones, or null when full. */
export function nextOpenSlot(occupied: number[]): number | null {
  for (let n = 1; n <= 20; n++) if (!occupied.includes(n)) return n
  return null
}

/**
 * Grows a genealogy tree from the backend one team at a time. `root` is the starting tree;
 * `loadTeam(member)` fetches a member's direct partners (GET /api/partner/:vedId/genealogy —
 * Admin only) the first time their card is opened. Partners can't read other IDs' teams, so the
 * Partner screen passes a root whose members are not `pending` and nothing is loaded.
 */
export function useGenealogyTree(root: TreeMember | null) {
  const queryClient = useQueryClient()
  /** vedId → its loaded team */
  const [teams, setTeams] = useState<Record<string, TreeMember[]>>({})

  const attach = (m: TreeMember): TreeMember => {
    const team = teams[m.id]
    if (!team) return { ...m, children: m.children.map(attach) }
    return {
      ...m,
      pending: false,
      direct: team.filter((c) => c.slot <= 20).length,
      openSlot: nextOpenSlot(team.map((c) => c.slot)),
      children: team.map(attach),
    }
  }

  const tree = root ? attach(root) : null

  const loadTeam = async (member: TreeMember) => {
    if (!member.pending || teams[member.id]) return
    try {
      const partners = await queryClient.fetchQuery({
        queryKey: genealogyKeys.of(member.id),
        queryFn: () => getGenealogyOf(member.id),
      })
      setTeams((t) => ({
        ...t,
        [member.id]: partners.map((p) =>
          toTreeMember(p, member, { canLoadTeam: member.level + 1 < 5 }),
        ),
      }))
    } catch (error) {
      toast.error(apiErrorMessage(error, `Couldn't load ${member.fullName}'s team`))
      setTeams((t) => ({ ...t, [member.id]: [] }))
    }
  }

  /** Every member loaded so far, root included — for the "selected member" panel. */
  const index = new Map<string, TreeMember>()
  const walk = (m: TreeMember) => {
    index.set(m.id, m)
    m.children.forEach(walk)
  }
  if (tree) walk(tree)

  return { tree, index, loadTeam }
}
