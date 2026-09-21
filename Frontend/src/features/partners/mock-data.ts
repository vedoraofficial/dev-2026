/** Sample data for Partners and Founders. Replace with API calls in `api.ts` / `queries.ts`. */

export type PartnerStatus = "active" | "pan-pending" | "inactive"

export type PartnerRow = {
  id: string
  name: string
  sponsor: string
  slotsUsed: number
  team: number
  wallet: number
  status: PartnerStatus
  founder?: boolean
}

export const partners: PartnerRow[] = [
  {
    id: "VED000001",
    name: "Poonam Medhavi",
    sponsor: "VED108",
    slotsUsed: 20,
    team: 2981,
    wallet: 840000,
    status: "active",
    founder: true,
  },
  {
    id: "VED000418",
    name: "Rohit Deshmukh",
    sponsor: "VED000301",
    slotsUsed: 14,
    team: 214,
    wallet: 48600,
    status: "active",
  },
  {
    id: "VED000462",
    name: "Imran Shaikh",
    sponsor: "VED000418",
    slotsUsed: 20,
    team: 96,
    wallet: 102400,
    status: "active",
  },
  {
    id: "VED000478",
    name: "Meera Joshi",
    sponsor: "VED000418",
    slotsUsed: 4,
    team: 18,
    wallet: 9400,
    status: "pan-pending",
  },
  {
    id: "VED000491",
    name: "Akash Patil",
    sponsor: "VED000418",
    slotsUsed: 7,
    team: 7,
    wallet: 22800,
    status: "inactive",
  },
  {
    id: "VED000568",
    name: "Pooja Nair",
    sponsor: "VED000418",
    slotsUsed: 11,
    team: 31,
    wallet: 17200,
    status: "active",
  },
  {
    id: "VED000455",
    name: "Sneha Kulkarni",
    sponsor: "VED000418",
    slotsUsed: 9,
    team: 42,
    wallet: 31200,
    status: "active",
  },
]

export const partnerTabs = [
  { value: "all", label: "All 6,482" },
  { value: "founders", label: "Founders 3" },
  { value: "active", label: "Active 6,118" },
  { value: "free-active", label: "Free Active 208" },
  { value: "inactive", label: "Inactive 364" },
  { value: "pan-pending", label: "PAN pending 23" },
]

export type Founder = {
  id: string
  name: string
  upline: string
  slotsUsed: number
  downline: number
  bvUnderLeg: number
  incomeEarned: number
  memberSince: string
}

export const founders: Founder[] = [
  {
    id: "VED000001",
    name: "Poonam Amit Medhavi",
    upline: "VED108",
    slotsUsed: 20,
    downline: 2981,
    bvUnderLeg: 842000,
    incomeEarned: 84280,
    memberSince: "Mar 2026",
  },
  {
    id: "VED000002",
    name: "Neelam Prashant Dongare",
    upline: "VED108",
    slotsUsed: 18,
    downline: 2139,
    bvUnderLeg: 617000,
    incomeEarned: 61700,
    memberSince: "Mar 2026",
  },
  {
    id: "VED000003",
    name: "Shital Pravin Bhor",
    upline: "VED108",
    slotsUsed: 15,
    downline: 1362,
    bvUnderLeg: 394000,
    incomeEarned: 39400,
    memberSince: "Mar 2026",
  },
]
