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

/** Partner view: the signed-in partner's whole downline, Level 1 to Level 5. */
export type PartnerTreeMember = {
  id: string
  /** Short label on the tree card */
  name: string
  fullName: string
  /** 0 = you, 1 = your direct partners … 5 = deepest level */
  level: number
  /** Position under the sponsor. Above 20 = valid in the tree but earns the sponsor no BV. */
  slot: number
  sponsor: string
  joined: string
  direct: number
  downline: number
  bvContributed: number
  /** Next free BV-eligible slot, or null when 20 / 20 are taken */
  openSlot: number | null
  children: PartnerTreeMember[]
}

const MAX_LEVEL = 5
const MAX_DIRECT = 20

/** [id, full name, joined, children] — the API will return the tree already nested like this. */
type Seed = [id: string, fullName: string, joined: string, children?: Seed[]]

const sampleNames = [
  "Aarti Pawar",
  "Vikas Jadhav",
  "Pradnya Gaikwad",
  "Sagar Mane",
  "Neha Kadam",
  "Rahul Salunkhe",
  "Snehal Bhosale",
  "Amol Chavan",
  "Komal Thorat",
  "Nikhil Deshpande",
  "Pooja Kharat",
  "Tushar Wagh",
  "Rutuja Shinde",
  "Ganesh More",
  "Priya Kulkarni",
  "Yogesh Patil",
  "Shruti Joshi",
  "Mahesh Gore",
  "Anjali Rane",
  "Sachin Bhagat",
  "Madhuri Sawant",
  "Kiran Lokhande",
  "Swati Nikam",
  "Rohan Kamble",
  "Ashwini Dhole",
  "Sandeep Mhatre",
  "Varsha Ingle",
  "Prashant Sutar",
]
const joinedMonth: Record<number, string> = { 1: "Jun", 2: "Jul", 3: "Aug", 4: "Aug", 5: "Sep" }
/** Sample members each person has at levels 3–5 (kept small so the page stays light). */
const sampleBranching: Record<number, number> = { 3: 2, 4: 1, 5: 1 }

let nextId = 700
let nextName = 0

function sampleTeam(level: number, count: number, withTeam = true): Seed[] {
  if (level > MAX_LEVEL) return []
  return Array.from({ length: count }, () => {
    const id = `VED${String(nextId++).padStart(6, "0")}`
    const day = String((nextId % 27) + 1).padStart(2, "0")
    return [
      id,
      sampleNames[nextName++ % sampleNames.length],
      `${day} ${joinedMonth[level]} 2026`,
      withTeam ? sampleTeam(level + 1, sampleBranching[level + 1] ?? 0) : [],
    ]
  })
}

function buildMember(seed: Seed, sponsor: string, level: number, slot: number): PartnerTreeMember {
  const [id, fullName, joined, seeds = []] = seed
  const children = seeds.map((s, i) => buildMember(s, id, level + 1, i + 1))
  const downline = children.reduce((sum, c) => sum + 1 + c.downline, 0)
  const direct = Math.min(children.length, MAX_DIRECT)
  const [first, last = ""] = fullName.split(" ")
  return {
    id,
    name: last ? `${first} ${last[0]}.` : first,
    fullName,
    level,
    slot,
    sponsor,
    joined,
    direct,
    downline,
    bvContributed: (downline + 1) * 1000,
    openSlot: children.length < MAX_DIRECT ? children.length + 1 : null,
    children,
  }
}

export const partnerTree = buildMember(
  [
    "VED000418",
    "Rohit Deshmukh",
    "14 Mar 2026",
    [
      [
        "VED000455",
        "Sneha Kulkarni",
        "02 Jun 2026",
        [
          ["VED000512", "Aditya Kale", "05 Jul 2026", sampleTeam(3, 2)],
          ["VED000534", "Kavya Nimbalkar", "09 Jul 2026", sampleTeam(3, 2)],
        ],
      ],
      [
        "VED000462",
        "Imran Shaikh",
        "14 Jun 2026",
        [
          ["VED000549", "Farhan Qureshi", "11 Jul 2026", sampleTeam(3, 2)],
          // Slots 2–20 filled, then a 21st partner placed beyond the cap.
          ...sampleTeam(2, 19, false),
          ["VED000601", "Vivek Rane", "03 Sep 2026"],
        ],
      ],
      [
        "VED000478",
        "Meera Joshi",
        "29 Jun 2026",
        [["VED000588", "Omkar Shinde", "18 Jul 2026", sampleTeam(3, 2)], ...sampleTeam(2, 1)],
      ],
      // Slots 4–14: more direct partners who joined, shown behind "+11 more joined".
      ...sampleTeam(1, 11, false),
    ],
  ],
  "VED000301",
  0,
  7,
)
