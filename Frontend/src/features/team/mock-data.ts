import { partnerTree } from "@/features/genealogy/mock-data"

export type TeamMemberStatus = "active" | "free-active" | "no-bv"

export type TeamMember = {
  id: string
  name: string
  level: number
  joined: string
  slot: number
  downline: number
  srp: number
  status: TeamMemberStatus
}

/** The signed-in partner's whole downline (every level), derived from the shared genealogy tree
 * so Team and Genealogy always agree on who's who. */
function toTeamMember(m: (typeof partnerTree)["children"][number]): TeamMember {
  const beyondCap = m.slot > 20
  const status: TeamMemberStatus = beyondCap ? "no-bv" : m.slot % 4 === 0 ? "free-active" : "active"
  const srp = beyondCap ? 2 : Math.min(48, 4 + m.downline * 2 + ((m.slot * 3) % 11))

  return {
    id: m.id,
    name: m.fullName,
    level: m.level,
    joined: m.joined,
    slot: m.slot,
    downline: m.downline,
    srp,
    status,
  }
}

function flattenDownline(node: typeof partnerTree): TeamMember[] {
  return node.children.flatMap((child) => [toTeamMember(child), ...flattenDownline(child)])
}

export const teamMembers: TeamMember[] = flattenDownline(partnerTree)

export const levelCounts = [1, 2, 3, 4, 5].map((level) => ({
  level,
  count: teamMembers.filter((m) => m.level === level).length,
  cap: level === 1 ? 20 : undefined,
}))
