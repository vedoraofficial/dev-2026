/** Sample data for Partners and Founders. Replace with API calls in `api.ts` / `queries.ts`. */

export type PartnerStatus = "active" | "free-active" | "pan-pending" | "inactive"

export type PartnerRow = {
  id: string
  name: string
  mobile: string
  sponsor: string
  /** Depth in the genealogy from Root Admin — what the "Level" filter matches on. */
  level: number
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
    mobile: "+91 98220 10001",
    sponsor: "VED108",
    level: 1,
    slotsUsed: 20,
    team: 2981,
    wallet: 840000,
    status: "active",
    founder: true,
  },
  {
    id: "VED000418",
    name: "Rohit Deshmukh",
    mobile: "+91 98220 41288",
    sponsor: "VED000301",
    level: 2,
    slotsUsed: 14,
    team: 214,
    wallet: 48600,
    status: "active",
  },
  {
    id: "VED000462",
    name: "Imran Shaikh",
    mobile: "+91 90112 74625",
    sponsor: "VED000418",
    level: 3,
    slotsUsed: 20,
    team: 96,
    wallet: 102400,
    status: "active",
  },
  {
    id: "VED000478",
    name: "Meera Joshi",
    mobile: "+91 98765 04781",
    sponsor: "VED000418",
    level: 3,
    slotsUsed: 4,
    team: 18,
    wallet: 9400,
    status: "pan-pending",
  },
  {
    id: "VED000491",
    name: "Akash Patil",
    mobile: "+91 99225 04911",
    sponsor: "VED000418",
    level: 5,
    slotsUsed: 7,
    team: 7,
    wallet: 22800,
    status: "inactive",
  },
  {
    id: "VED000568",
    name: "Pooja Nair",
    mobile: "+91 97025 05681",
    sponsor: "VED000418",
    level: 3,
    slotsUsed: 11,
    team: 31,
    wallet: 17200,
    status: "active",
  },
  {
    id: "VED000455",
    name: "Sneha Kulkarni",
    mobile: "+91 96073 04551",
    sponsor: "VED000418",
    level: 3,
    slotsUsed: 9,
    team: 42,
    wallet: 31200,
    status: "active",
  },
  {
    id: "VED000512",
    name: "Karan Mehta",
    mobile: "+91 89561 05121",
    sponsor: "VED000455",
    level: 4,
    slotsUsed: 3,
    team: 5,
    wallet: 6200,
    status: "free-active",
  },
  {
    id: "VED000533",
    name: "Aditya Kale",
    mobile: "+91 93705 05331",
    sponsor: "VED000455",
    level: 4,
    slotsUsed: 6,
    team: 11,
    wallet: 14800,
    status: "active",
  },
  {
    id: "VED000549",
    name: "Farhan Qureshi",
    mobile: "+91 92255 05491",
    sponsor: "VED000462",
    level: 4,
    slotsUsed: 2,
    team: 3,
    wallet: 4200,
    status: "active",
  },
  {
    id: "VED000561",
    name: "Kavya Nimbalkar",
    mobile: "+91 91675 05611",
    sponsor: "VED000455",
    level: 4,
    slotsUsed: 5,
    team: 8,
    wallet: 11600,
    status: "free-active",
  },
  {
    id: "VED000577",
    name: "Omkar Shinde",
    mobile: "+91 90864 05771",
    sponsor: "VED000478",
    level: 4,
    slotsUsed: 3,
    team: 4,
    wallet: 5400,
    status: "active",
  },
  {
    id: "VED000588",
    name: "Priya Kulkarni",
    mobile: "+91 89432 05881",
    sponsor: "VED000568",
    level: 4,
    slotsUsed: 1,
    team: 1,
    wallet: 1999,
    status: "pan-pending",
  },
  {
    id: "VED000603",
    name: "Yogesh Patil",
    mobile: "+91 88123 06031",
    sponsor: "VED000512",
    level: 5,
    slotsUsed: 2,
    team: 2,
    wallet: 3200,
    status: "active",
  },
  {
    id: "VED000617",
    name: "Rutuja Shinde",
    mobile: "+91 87965 06171",
    sponsor: "VED000462",
    level: 4,
    slotsUsed: 0,
    team: 0,
    wallet: 0,
    status: "inactive",
  },
  {
    id: "VED000629",
    name: "Tushar Wagh",
    mobile: "+91 86541 06291",
    sponsor: "VED000491",
    level: 5,
    slotsUsed: 4,
    team: 6,
    wallet: 8600,
    status: "active",
  },
]

/** Tab filters above the Partners table. `total` is the full-dataset count shown in the tab label. */
export const partnerTabs: {
  value: PartnerStatus | "all" | "founders"
  label: string
  total: number
}[] = [
  { value: "all", label: "All 6,482", total: 6482 },
  { value: "founders", label: "Founders 3", total: 3 },
  { value: "active", label: "Active 6,118", total: 6118 },
  { value: "free-active", label: "Free Active 208", total: 208 },
  { value: "inactive", label: "Inactive 364", total: 364 },
  { value: "pan-pending", label: "PAN pending 23", total: 23 },
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
