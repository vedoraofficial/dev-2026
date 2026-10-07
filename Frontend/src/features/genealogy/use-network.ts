import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import { getGenealogyOf } from "@/features/genealogy/api"
import { genealogyKeys } from "@/features/genealogy/queries"
import { FOUNDER_IDS, FOUNDER_NAMES } from "@/features/genealogy/use-genealogy-tree"
import { mapLimit } from "@/lib/async"
import { useSession } from "@/lib/session"

/** One person in a network or downline. */
export type NetworkMember = {
  vedId: string
  name: string
  email: string
  mobile: string
  /** Admin network: 1 = Founder, 2 = a Founder's direct partner, …
   *  My downline: 1 = my direct partner, 2 = their partner, … */
  level: number
  /** Slot under the sponsor (Founders: their fixed number 1–3) */
  slot: number
  sponsor: string
  /** The Founder whose leg this member is in */
  founderId: string
  /** Placement status: ACTIVE, PENDING, SUSPENDED */
  status: string
  isFounder: boolean
  /** Direct partners */
  direct: number
  /** Everyone below, all levels */
  team: number
}

/**
 * Walks teams downwards from `start` with GET /api/partner/:vedId/genealogy, a few calls at a time,
 * stopping below `maxLevel`. The backend has no "list my whole team" API, so this is how screens
 * get every level. Every call shares the cache with the genealogy tree.
 */
async function crawlTeams(
  queryClient: QueryClient,
  start: NetworkMember[],
  maxLevel = Number.POSITIVE_INFINITY,
): Promise<NetworkMember[]> {
  const members = new Map<string, NetworkMember>()
  const children = new Map<string, string[]>()
  start.forEach((m) => members.set(m.vedId, m))

  let frontier = start.filter((m) => m.level < maxLevel)
  while (frontier.length) {
    const teams = await mapLimit(frontier, 6, (m) =>
      queryClient.fetchQuery({
        queryKey: genealogyKeys.of(m.vedId),
        queryFn: () => getGenealogyOf(m.vedId),
        staleTime: 30_000,
      }),
    )
    const next: NetworkMember[] = []
    frontier.forEach((parent, i) => {
      const team = teams[i] ?? []
      parent.direct = team.length
      children.set(
        parent.vedId,
        team.map((p) => p.vedId),
      )
      for (const p of team) {
        if (members.has(p.vedId)) continue // never loop on bad data
        const member: NetworkMember = {
          vedId: p.vedId,
          name: p.name,
          email: p.email,
          mobile: p.mobile,
          level: parent.level + 1,
          slot: p.slotNumber,
          sponsor: parent.vedId,
          founderId: parent.founderId,
          status: p.status,
          isFounder: false,
          direct: 0,
          team: 0,
        }
        members.set(p.vedId, member)
        if (member.level < maxLevel) next.push(member)
      }
    })
    frontier = next
  }

  // Team size = everyone below (within what was walked), counted bottom-up.
  const countTeam = (id: string): number =>
    (children.get(id) ?? []).reduce((sum, c) => sum + 1 + countTeam(c), 0)
  members.forEach((m) => (m.team = countTeam(m.vedId)))

  return [...members.values()]
}

/** Admin: the whole network from the three Founders down. */
function crawlNetwork(queryClient: QueryClient, adminId: string): Promise<NetworkMember[]> {
  const founders: NetworkMember[] = FOUNDER_IDS.map((id, i) => ({
    vedId: id,
    name: FOUNDER_NAMES[id] ?? id,
    email: "",
    mobile: "",
    level: 1,
    slot: i + 1,
    sponsor: adminId,
    founderId: id,
    status: "ACTIVE",
    isFounder: true,
    direct: 0,
    team: 0,
  }))
  return crawlTeams(queryClient, founders)
}

/** [Admin] Everyone in the network (Founders included). */
export function useNetwork(adminId = "VED108") {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: [...genealogyKeys.all, "network"],
    queryFn: () => crawlNetwork(queryClient, adminId),
  })
}

/** How deep a Founder's or Partner's own team view goes (income runs 5 levels deep). */
const TEAM_LEVELS = 5

/**
 * [Founder / Partner] My team down to Level 5 — Level 1 = my direct partners. The backend lets
 * a user read only their own downline, which is exactly what this walks.
 */
export function useMyDownline() {
  const me = useSession((s) => s.user)
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: [...genealogyKeys.all, "downline", me?.vedId],
    enabled: !!me,
    queryFn: async () => {
      const root: NetworkMember = {
        vedId: me?.vedId ?? "",
        name: me?.name ?? "",
        email: me?.email ?? "",
        mobile: "",
        level: 0,
        slot: 0,
        sponsor: "",
        founderId: me?.vedId ?? "",
        status: "ACTIVE",
        isFounder: false,
        direct: 0,
        team: 0,
      }
      const all = await crawlTeams(queryClient, [root], TEAM_LEVELS)
      return all.filter((m) => m.level >= 1)
    },
  })
}
