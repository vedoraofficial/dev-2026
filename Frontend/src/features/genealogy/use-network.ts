import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import { getGenealogyOf } from "@/features/genealogy/api"
import { genealogyKeys } from "@/features/genealogy/queries"
import { FOUNDER_IDS, FOUNDER_NAMES } from "@/features/genealogy/use-genealogy-tree"
import { mapLimit } from "@/lib/async"

/** One person in the network, as Admin sees it. */
export type NetworkMember = {
  vedId: string
  name: string
  email: string
  mobile: string
  /** 1 = Founder, 2 = a Founder's direct partner, … */
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
 * Walks the whole network from the three Founders down with
 * GET /api/partner/:vedId/genealogy (Admin only), a few calls at a time. The backend has no
 * "list all partners" API, so this is how Admin's Partners, Founders and Overview get real data.
 * Every call shares the cache with the Genealogy Viewer.
 */
async function crawlNetwork(queryClient: QueryClient, adminId: string): Promise<NetworkMember[]> {
  const members = new Map<string, NetworkMember>()
  const children = new Map<string, string[]>()

  let frontier: NetworkMember[] = FOUNDER_IDS.map((id, i) => ({
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
  frontier.forEach((m) => members.set(m.vedId, m))

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
        next.push(member)
      }
    })
    frontier = next
  }

  // Team size = everyone below, counted bottom-up.
  const countTeam = (id: string): number =>
    (children.get(id) ?? []).reduce((sum, c) => sum + 1 + countTeam(c), 0)
  members.forEach((m) => (m.team = countTeam(m.vedId)))

  return [...members.values()]
}

/** [Admin] Everyone in the network (Founders included). */
export function useNetwork(adminId = "VED108") {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: [...genealogyKeys.all, "network"],
    queryFn: () => crawlNetwork(queryClient, adminId),
  })
}
