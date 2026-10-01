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

/** Options for the Income Reports "Period" filter. */
export const INCOME_PERIODS = ["01–18 Sep", "Last month", "Custom"] as const
export type IncomePeriod = (typeof INCOME_PERIODS)[number]

export const periodDateLabel: Record<IncomePeriod, string> = {
  "01–18 Sep": "01 Sep – 18 Sep 2026",
  "Last month": "01 Aug – 31 Aug 2026",
  Custom: "01 Aug – 18 Sep 2026",
}

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

/** 01–18 Sep 2026 — the current period. */
const septemberLedger: LedgerEntry[] = [
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

/** Last month — August 2026. */
const augustLedger: LedgerEntry[] = [
  {
    id: "9",
    date: "28 Aug",
    order: "ORD-00982",
    seller: "VED000455",
    recipient: "VED000455",
    type: "Direct Sale",
    level: "—",
    amount: 200,
  },
  {
    id: "10",
    date: "28 Aug",
    order: "ORD-00982",
    seller: "VED000455",
    recipient: "VED000418",
    type: "BV Level Income",
    level: "L1",
    amount: 100,
  },
  {
    id: "11",
    date: "25 Aug",
    order: "ORD-00966",
    seller: "VED000462",
    recipient: "VED000462",
    type: "Direct Sale",
    level: "—",
    amount: 200,
  },
  {
    id: "12",
    date: "25 Aug",
    order: "ORD-00966",
    seller: "VED000462",
    recipient: "VED000418",
    type: "BV Level Income",
    level: "L1",
    amount: 100,
  },
  {
    id: "13",
    date: "20 Aug",
    order: "ORD-00940",
    seller: "VED000601",
    recipient: "VED000462",
    type: "Capped — 21st slot",
    level: "L1",
    amount: 0,
    excluded: true,
  },
  {
    id: "14",
    date: "18 Aug",
    order: "ORD-00918",
    seller: "VED000568",
    recipient: "VED000568",
    type: "Direct Sale",
    level: "—",
    amount: 200,
  },
]

export const commissionLedgerByPeriod: Record<IncomePeriod, LedgerEntry[]> = {
  "01–18 Sep": septemberLedger,
  "Last month": augustLedger,
  Custom: [...septemberLedger, ...augustLedger],
}

export const payoutTotalByPeriod: Record<IncomePeriod, number> = {
  "01–18 Sep": 1104000,
  "Last month": 986000,
  Custom: 1104000 + 986000,
}

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
  { value: "all", label: "All Income" },
  { value: "direct", label: "Direct Sale" },
  { value: "bv", label: "BV Level" },
  { value: "activation", label: "Activation-only" },
  { value: "capped", label: "Capped / excluded" },
]

export type PartnerIncomeCategory = "direct" | "bv" | "activation" | "capped"

export type PartnerIncomeEntry = {
  id: string
  date: string
  source: string
  type: string
  category: PartnerIncomeCategory
  /** Suffix like "capped" or "ID inactive" shown in red after the type */
  flag?: string
  bv: number
  level: string
  levelNote?: string
  amount: number
}

export const partnerIncome: PartnerIncomeEntry[] = [
  // --- 18 Sep 2026 ---
  {
    id: "1",
    date: "18 Sep 2026",
    source: "VED000631",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "2",
    date: "18 Sep 2026",
    source: "VED000631",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L1 · 10%",
    amount: 100,
  },
  {
    id: "3",
    date: "18 Sep 2026",
    source: "VED000650",
    type: "Activation-only purchase",
    category: "activation",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
  // --- 17 Sep 2026 ---
  {
    id: "4",
    date: "17 Sep 2026",
    source: "VED000624",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "5",
    date: "17 Sep 2026",
    source: "VED000549",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L2 · 10%",
    amount: 100,
  },
  {
    id: "6",
    date: "17 Sep 2026",
    source: "VED000588",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L4 · 5%",
    amount: 50,
  },
  // --- 16 Sep 2026 ---
  {
    id: "7",
    date: "16 Sep 2026",
    source: "VED000615",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "8",
    date: "16 Sep 2026",
    source: "VED000562",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L5 · 5%",
    amount: 50,
  },
  {
    id: "9",
    date: "16 Sep 2026",
    source: "VED000638",
    type: "Activation-only purchase",
    category: "activation",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
  {
    id: "10",
    date: "16 Sep 2026",
    source: "VED000601",
    type: "BV Level Income",
    category: "capped",
    flag: "capped",
    bv: 1000,
    level: "L1 · 21st slot",
    amount: 0,
  },
  // --- 15 Sep 2026 ---
  {
    id: "11",
    date: "15 Sep 2026",
    source: "VED000598",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "12",
    date: "15 Sep 2026",
    source: "VED000512",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L3 · 10%",
    amount: 100,
  },
  {
    id: "13",
    date: "15 Sep 2026",
    source: "VED000490",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L1 · 10%",
    amount: 100,
  },
  {
    id: "14",
    date: "15 Sep 2026",
    source: "VED000595",
    type: "BV Level Income",
    category: "capped",
    flag: "slot cap reached",
    bv: 1000,
    level: "L1 · slot 22 (max 20)",
    amount: 0,
  },
  // --- 14 Sep 2026 ---
  {
    id: "15",
    date: "14 Sep 2026",
    source: "VED000534",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "16",
    date: "14 Sep 2026",
    source: "VED000481",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L2 · 10%",
    amount: 100,
  },
  // --- 13 Sep 2026 ---
  {
    id: "17",
    date: "13 Sep 2026",
    source: "VED000498",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "18",
    date: "13 Sep 2026",
    source: "VED000466",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L3 · 10%",
    amount: 100,
  },
  {
    id: "19",
    date: "13 Sep 2026",
    source: "VED000644",
    type: "Activation-only purchase",
    category: "activation",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
  {
    id: "20",
    date: "13 Sep 2026",
    source: "VED000582",
    type: "Direct Sale Commission",
    category: "capped",
    flag: "daily cap",
    bv: 1000,
    level: "—",
    amount: 0,
  },
  // --- 12 Sep 2026 ---
  {
    id: "21",
    date: "12 Sep 2026",
    source: "VED000472",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "22",
    date: "12 Sep 2026",
    source: "VED000445",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L1 · 10%",
    amount: 100,
  },
  // --- 11 Sep 2026 ---
  {
    id: "23",
    date: "11 Sep 2026",
    source: "VED000438",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L4 · 5%",
    amount: 50,
  },
  {
    id: "24",
    date: "11 Sep 2026",
    source: "VED000618",
    type: "Activation-only purchase",
    category: "activation",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
  {
    id: "25",
    date: "11 Sep 2026",
    source: "VED000572",
    type: "BV Level Income",
    category: "capped",
    flag: "ID inactive",
    bv: 1000,
    level: "L2 · pre-reactivation",
    amount: 0,
  },
  // --- 10 Sep 2026 ---
  {
    id: "26",
    date: "10 Sep 2026",
    source: "VED000455",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "27",
    date: "10 Sep 2026",
    source: "VED000419",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L5 · 5%",
    amount: 50,
  },
  // --- 09 Sep 2026 ---
  {
    id: "28",
    date: "09 Sep 2026",
    source: "VED000395",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L2 · 10%",
    amount: 100,
  },
  {
    id: "29",
    date: "09 Sep 2026",
    source: "VED000592",
    type: "Activation-only purchase",
    category: "activation",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
  {
    id: "30",
    date: "09 Sep 2026",
    source: "VED000520",
    type: "BV Level Income",
    category: "capped",
    flag: "unqualified",
    bv: 1000,
    level: "L3 · monthly BV pending",
    amount: 0,
  },
  // --- 08 Sep 2026 ---
  {
    id: "31",
    date: "08 Sep 2026",
    source: "VED000412",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  // --- 07 Sep 2026 ---
  {
    id: "32",
    date: "07 Sep 2026",
    source: "VED000371",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L1 · 10%",
    amount: 100,
  },
  {
    id: "33",
    date: "07 Sep 2026",
    source: "VED000560",
    type: "Activation-only purchase",
    category: "activation",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
  // --- 06 Sep 2026 ---
  {
    id: "34",
    date: "06 Sep 2026",
    source: "VED000388",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "35",
    date: "06 Sep 2026",
    source: "VED000488",
    type: "BV Level Income",
    category: "capped",
    flag: "capped",
    bv: 1000,
    level: "L1 · slot 23",
    amount: 0,
  },
  // --- 05 Sep 2026 ---
  {
    id: "36",
    date: "05 Sep 2026",
    source: "VED000355",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L3 · 10%",
    amount: 100,
  },
  {
    id: "37",
    date: "05 Sep 2026",
    source: "VED000524",
    type: "Activation-only purchase",
    category: "activation",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
  // --- 04 Sep 2026 ---
  {
    id: "38",
    date: "04 Sep 2026",
    source: "VED000365",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "39",
    date: "04 Sep 2026",
    source: "VED000430",
    type: "BV Level Income",
    category: "capped",
    flag: "ID inactive",
    bv: 1000,
    level: "L4 · grace period expired",
    amount: 0,
  },
  // --- 03 Sep 2026 ---
  {
    id: "40",
    date: "03 Sep 2026",
    source: "VED000332",
    type: "BV Level Income",
    category: "bv",
    bv: 1000,
    level: "L4 · 5%",
    amount: 50,
  },
  {
    id: "41",
    date: "03 Sep 2026",
    source: "VED000392",
    type: "BV Level Income",
    category: "capped",
    flag: "depth exceeded",
    bv: 1000,
    level: "L6 · beyond plan depth",
    amount: 0,
  },
  // --- 02 Sep 2026 ---
  {
    id: "42",
    date: "02 Sep 2026",
    source: "VED000340",
    type: "Direct Sale Commission",
    category: "direct",
    bv: 1000,
    level: "—",
    amount: 200,
  },
  {
    id: "43",
    date: "02 Sep 2026",
    source: "VED000488",
    type: "Activation-only purchase",
    category: "activation",
    bv: 0,
    level: "No new ID",
    amount: 200,
  },
]
