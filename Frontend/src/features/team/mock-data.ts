export const levelCounts = [
  { level: 1, count: 14, cap: 20 },
  { level: 2, count: 98 },
  { level: 3, count: 72 },
  { level: 4, count: 62 },
  { level: 5, count: 38 },
]

export type TeamMemberStatus = "active" | "free-active" | "no-bv"

export type TeamMember = {
  id: string
  name: string
  joined: string
  slot: number
  downline: number
  srp: number
  status: TeamMemberStatus
}

export const directTeam: TeamMember[] = [
  {
    id: "VED000455",
    name: "Sneha Kulkarni",
    joined: "02 Jun 2026",
    slot: 1,
    downline: 42,
    srp: 18,
    status: "active",
  },
  {
    id: "VED000462",
    name: "Imran Shaikh",
    joined: "14 Jun 2026",
    slot: 2,
    downline: 96,
    srp: 26,
    status: "active",
  },
  {
    id: "VED000478",
    name: "Meera Joshi",
    joined: "29 Jun 2026",
    slot: 3,
    downline: 18,
    srp: 6,
    status: "active",
  },
  {
    id: "VED000491",
    name: "Akash Patil",
    joined: "11 Jul 2026",
    slot: 4,
    downline: 7,
    srp: 4,
    status: "free-active",
  },
  {
    id: "VED000601",
    name: "Vivek Rane",
    joined: "03 Sep 2026",
    slot: 21,
    downline: 2,
    srp: 8,
    status: "no-bv",
  },
  {
    id: "VED000568",
    name: "Pooja Nair",
    joined: "22 Jul 2026",
    slot: 5,
    downline: 31,
    srp: 12,
    status: "active",
  },
]
