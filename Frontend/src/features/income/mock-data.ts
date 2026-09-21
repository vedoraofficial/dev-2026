/** Sample data for the income screens. The commission engine (backend) produces every number. */

/** Admin: payout split across the plan (one product sale = ₹600 distributed) */
export const payoutSplit = [
  { label: "Direct Sale ₹200", amount: 368000, tone: "direct" as const },
  { label: "Level 1 · 10%", amount: 184000, tone: "mid" as const },
  { label: "Level 2 · 10%", amount: 184000, tone: "mid" as const },
  { label: "Level 3 · 10%", amount: 184000, tone: "mid" as const },
  { label: "Level 4 · 5%", amount: 92000, tone: "low" as const },
  { label: "Level 5 · 5%", amount: 92000, tone: "low" as const },
]

export const payoutTotal = 1104000

export const topEarners = [
  { name: "Poonam Medhavi", id: "VED000001", amount: 84200 },
  { name: "Neelam Dongare", id: "VED000002", amount: 61700 },
  { name: "Rohit Deshmukh", id: "VED000418", amount: 56400 },
  { name: "Imran Shaikh", id: "VED000462", amount: 48900 },
  { name: "Sneha Kulkarni", id: "VED000455", amount: 39100 },
]

export type LedgerEntry = {
  id: string
  date: string
  order: string
  seller: string
  recipient: string
  type: string
  level: string
  amount: number
  /** Row earned nothing (capped / inactive) */
  excluded?: boolean
}

export const commissionLedger: LedgerEntry[] = [
  {
    id: "1",
    date: "18 Sep",
    order: "ORD-01204",
    seller: "VED000631",
    recipient: "VED000631",
    type: "Direct Sale",
    level: "—",
    amount: 200,
  },
  {
    id: "2",
    date: "18 Sep",
    order: "ORD-01204",
    seller: "VED000631",
    recipient: "VED000631",
    type: "BV Level Income",
    level: "L1",
    amount: 100,
  },
  {
    id: "3",
    date: "18 Sep",
    order: "ORD-01204",
    seller: "VED000631",
    recipient: "VED000418",
    type: "BV Level Income",
    level: "L2",
    amount: 100,
  },
  {
    id: "4",
    date: "18 Sep",
    order: "ORD-01204",
    seller: "VED000631",
    recipient: "VED000301",
    type: "BV Level Income",
    level: "L3",
    amount: 100,
  },
  {
    id: "5",
    date: "18 Sep",
    order: "ORD-01204",
    seller: "VED000631",
    recipient: "VED000102",
    type: "BV Level Income",
    level: "L4",
    amount: 50,
  },
  {
    id: "6",
    date: "18 Sep",
    order: "ORD-01204",
    seller: "VED000631",
    recipient: "VED000001",
    type: "BV Level Income",
    level: "L5",
    amount: 50,
  },
  {
    id: "7",
    date: "16 Sep",
    order: "ORD-01188",
    seller: "VED000601",
    recipient: "VED000462",
    type: "Capped — 21st slot",
    level: "L1",
    amount: 0,
    excluded: true,
  },
  {
    id: "8",
    date: "11 Sep",
    order: "ORD-01151",
    seller: "VED000572",
    recipient: "VED000418",
    type: "Skipped — ID inactive",
    level: "L2",
    amount: 0,
    excluded: true,
  },
]

/** Partner: the signed-in partner's own income */
export const partnerIncomeSummary = [
  { label: "Direct Sale", amount: 22000, hint: "110 sales × ₹200", highlight: true },
  { label: "Level 1", amount: 12400, hint: "14 / 20 eligible" },
  { label: "Level 2", amount: 9800, hint: "98 eligible" },
  { label: "Level 3", amount: 7200, hint: "72 eligible" },
  { label: "Level 4", amount: 3100, hint: "62 eligible" },
  { label: "Level 5", amount: 1900, hint: "38 eligible" },
]

export const partnerIncomeTabs = [
  { value: "all", label: "All income" },
  { value: "direct", label: "Direct Sale" },
  { value: "bv", label: "BV Level" },
  { value: "activation", label: "Activation-only" },
  { value: "capped", label: "Capped / excluded" },
]

export type PartnerIncomeEntry = {
  id: string
  date: string
  source: string
  type: string
  /** Suffix like "capped" or "ID inactive" shown in red after the type */
  flag?: string
  bv: number
  level: string
  levelNote?: string
  amount: number
}

export const partnerIncome: PartnerIncomeEntry[] = [
  {
    id: "1",
    date: "18 Sep 2026",
    source: "VED000631",
    type: "Direct Sale Commission",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "2",
    date: "18 Sep 2026",
    source: "VED000631",
    type: "BV Level Income",
    bv: 1000,
    level: "L1 · 10%",
    amount: 100,
  },
  {
    id: "3",
    date: "17 Sep 2026",
    source: "VED000549",
    type: "BV Level Income",
    bv: 1000,
    level: "L2 · 10%",
    amount: 100,
  },
  {
    id: "4",
    date: "17 Sep 2026",
    source: "VED000588",
    type: "BV Level Income",
    bv: 1000,
    level: "L4 · 5%",
    amount: 50,
  },
  {
    id: "5",
    date: "16 Sep 2026",
    source: "VED000601",
    type: "BV Level Income",
    flag: "capped",
    bv: 1000,
    level: "L1 · 21st slot",
    amount: 0,
  },
  {
    id: "6",
    date: "13 Sep 2026",
    source: "VED000644",
    type: "Activation-only purchase",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
  {
    id: "7",
    date: "11 Sep 2026",
    source: "VED000572",
    type: "BV Level Income",
    flag: "ID inactive",
    bv: 1000,
    level: "L2 · pre-reactivation",
    amount: 0,
  },
  {
    id: "8",
    date: "15 Sep 2026",
    source: "VED000512",
    type: "BV Level Income",
    bv: 1000,
    level: "L3 · 10%",
    amount: 100,
  },
  {
    id: "9",
    date: "14 Sep 2026",
    source: "VED000534",
    type: "Direct Sale Commission",
    bv: 1000,
    level: "—",
    amount: 200,
  },
]
