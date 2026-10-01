/** Sample data for the genealogy screens. Replace with API calls in `api.ts` / `queries.ts`. */

/** One node in a genealogy tree — the signed-in partner's downline, or the whole network. */
export type TreeMember = {
  id: string
  /** Short label on the tree card */
  name: string
  fullName: string
  /** Depth from the tree's root (root itself is 0). */
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
  children: TreeMember[]
}

/** @deprecated use {@link TreeMember} */
export type PartnerTreeMember = TreeMember

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

/**
 * A private id/name counter per tree, so two independent sample trees (Partner, Admin) never
 * generate colliding VEDORA IDs even though they share the same name list.
 */
function createTreeBuilder(startId: number) {
  let nextId = startId
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
      ] satisfies Seed
    })
  }

  function buildMember(seed: Seed, sponsor: string, level: number, slot: number): TreeMember {
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

  return { sampleTeam, buildMember }
}

/** Partner view: the signed-in partner's whole downline, Level 1 to Level 5. */
const partnerBuilder = createTreeBuilder(700)

export const partnerTree = partnerBuilder.buildMember(
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
          ["VED000512", "Aditya Kale", "05 Jul 2026", partnerBuilder.sampleTeam(3, 2)],
          ["VED000534", "Kavya Nimbalkar", "09 Jul 2026", partnerBuilder.sampleTeam(3, 2)],
        ],
      ],
      [
        "VED000462",
        "Imran Shaikh",
        "14 Jun 2026",
        [
          ["VED000549", "Farhan Qureshi", "11 Jul 2026", partnerBuilder.sampleTeam(3, 2)],
          // Slots 2–20 filled, then a 21st partner placed beyond the cap.
          ...partnerBuilder.sampleTeam(2, 19, false),
          ["VED000601", "Vivek Rane", "03 Sep 2026"],
        ],
      ],
      [
        "VED000478",
        "Meera Joshi",
        "29 Jun 2026",
        [
          ["VED000588", "Omkar Shinde", "18 Jul 2026", partnerBuilder.sampleTeam(3, 2)],
          ...partnerBuilder.sampleTeam(2, 1),
        ],
      ],
      // Slots 4–14: more direct partners who joined, shown behind "+11 more joined".
      ...partnerBuilder.sampleTeam(1, 11, false),
    ],
  ],
  "VED000301",
  0,
  7,
)

/**
 * Admin view: the whole network from Root Admin down — the 3 Founders and their full downlines.
 * Founders keep their real IDs; everyone below them is generated the same way as the Partner tree.
 */
const adminBuilder = createTreeBuilder(2000)

export const adminTree = adminBuilder.buildMember(
  [
    "VED108",
    "Root Admin",
    "",
    [
      [
        "VED000001",
        "Poonam Medhavi",
        "01 Mar 2026",
        [
          ["VED001901", "Devendra Kale", "12 Apr 2026", adminBuilder.sampleTeam(3, 3)],
          ["VED001902", "Ritika Bhonde", "18 Apr 2026", adminBuilder.sampleTeam(3, 2)],
          ...adminBuilder.sampleTeam(2, 18, false),
          // A 21st direct placement — valid in the tree, but earns Poonam no BV level income.
          ["VED001999", "Sanjay Deore", "10 Sep 2026"],
        ],
      ],
      [
        "VED000002",
        "Neelam Dongare",
        "03 Mar 2026",
        [
          ["VED001903", "Suraj Pardeshi", "15 Apr 2026", adminBuilder.sampleTeam(3, 2)],
          ["VED001904", "Ankita Ovhal", "22 Apr 2026", adminBuilder.sampleTeam(3, 2)],
          ...adminBuilder.sampleTeam(2, 16, false),
        ],
      ],
      [
        "VED000003",
        "Shital Bhor",
        "05 Mar 2026",
        [
          ["VED001905", "Nilesh Ghadge", "20 Apr 2026", adminBuilder.sampleTeam(3, 2)],
          ["VED001906", "Manasi Thakre", "27 Apr 2026", adminBuilder.sampleTeam(3, 1)],
          ...adminBuilder.sampleTeam(2, 13, false),
        ],
      ],
    ],
  ],
  "",
  0,
  0,
)
