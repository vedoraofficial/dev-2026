/** Sample data for the genealogy screens. Replace with API calls in `api.ts` / `queries.ts`. */

export type TreeNode = { id: string; team: number }

export type FounderLeg = {
  id: string
  name: string
  slotsUsed: number
  downline: number
  deepestLevel: number
  bvUnderLeg: number
  incomeEarned: number
  children: TreeNode[]
  moreChildren: number
}

/** Admin viewer: the three Founder legs directly under Root Admin. */
export const founderLegs: FounderLeg[] = [
  {
    id: "VED000001",
    name: "Poonam Medhavi",
    slotsUsed: 20,
    downline: 2981,
    deepestLevel: 11,
    bvUnderLeg: 842000,
    incomeEarned: 84280,
    children: [
      { id: "VED000301", team: 412 },
      { id: "VED000322", team: 268 },
    ],
    moreChildren: 18,
  },
  {
    id: "VED000002",
    name: "Neelam Dongare",
    slotsUsed: 18,
    downline: 2139,
    deepestLevel: 9,
    bvUnderLeg: 617000,
    incomeEarned: 61700,
    children: [
      { id: "VED000340", team: 331 },
      { id: "VED000358", team: 129 },
    ],
    moreChildren: 16,
  },
  {
    id: "VED000003",
    name: "Shital Bhor",
    slotsUsed: 15,
    downline: 1362,
    deepestLevel: 8,
    bvUnderLeg: 394000,
    incomeEarned: 39400,
    children: [
      { id: "VED000377", team: 204 },
      { id: "VED000391", team: 88 },
    ],
    moreChildren: 13,
  },
]

export const treeFooter = { depthShown: 3, totalNodes: 6485, widestLevel: 20 }

/** Partner view: the signed-in partner's direct line. */
export type PartnerChild = {
  id: string
  /** Short label on the tree card */
  name: string
  fullName: string
  direct: number
  /** Selected-member panel */
  sponsor: string
  joined: string
  downline: number
  bvContributed: number
  children: { id: string; level: number; note?: "beyond-cap" }[]
}

export const partnerTree = {
  me: { id: "VED000418", name: "Rohit Deshmukh", direct: 14, downline: 214 },
  openSlot: 15,
  children: [
    {
      id: "VED000455",
      name: "Sneha K.",
      fullName: "Sneha Kulkarni",
      direct: 9,
      sponsor: "VED000418",
      joined: "02 Jun 2026",
      downline: 42,
      bvContributed: 21000,
      children: [
        { id: "VED000512", level: 2 },
        { id: "VED000534", level: 2 },
      ],
    },
    {
      id: "VED000462",
      name: "Imran S.",
      fullName: "Imran Shaikh",
      direct: 20,
      sponsor: "VED000418",
      joined: "14 Jun 2026",
      downline: 96,
      bvContributed: 38000,
      children: [
        { id: "VED000549", level: 2 },
        { id: "VED000601", level: 2, note: "beyond-cap" as const },
      ],
    },
    {
      id: "VED000478",
      name: "Meera J.",
      fullName: "Meera Joshi",
      direct: 4,
      sponsor: "VED000418",
      joined: "29 Jun 2026",
      downline: 18,
      bvContributed: 9000,
      children: [{ id: "VED000588", level: 2 }],
    },
  ] satisfies PartnerChild[],
}
