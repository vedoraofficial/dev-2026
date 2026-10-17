/**
 * The published compensation plan, as printed on the website. These are fixed marketing figures —
 * actual partner earnings are calculated by the backend and shown in the partner portal.
 */
export const PLAN = {
  price: 1999,
  bvPerSale: 1000,
  directIncome: 200,
  levelIncome: 400,
  totalPerSale: 600,
  totalPercent: 60,
  directPartnersPerId: 20,
  paidLevels: 5,
} as const

export type PlanLevel = { level: number; percent: number; amount: number }

export const PLAN_LEVELS: readonly PlanLevel[] = [
  { level: 1, percent: 10, amount: 100 },
  { level: 2, percent: 10, amount: 100 },
  { level: 3, percent: 10, amount: 100 },
  { level: 4, percent: 5, amount: 50 },
  { level: 5, percent: 5, amount: 50 },
]

export const HOW_IT_WORKS = [
  {
    title: "Register",
    body: "Join under a sponsor with your PAN and details, and accept the Partner Agreement.",
  },
  { title: "Activate", body: "Purchase your first VEDORA bracelet to activate your partner ID." },
  {
    title: "Share & sell",
    body: "Sell bracelets to people who will love them. Each sale earns you ₹200 directly.",
  },
  {
    title: "Build a team",
    body: "Introduce partners. As they sell, you earn BV income up to five levels.",
  },
] as const

export const STRUCTURE_FACTS = [
  {
    value: "20",
    title: "Direct partners per ID",
    body: "Further partners are auto-placed into the next available position in your team.",
  },
  {
    value: "5",
    title: "Paid income levels",
    body: "10% on Levels 1–3, 5% on Levels 4–5, calculated on 1,000 BV per sale.",
  },
  {
    value: "∞",
    title: "Unlimited depth",
    body: "Your team can grow without limit; income is calculated on the five levels nearest you.",
  },
] as const

/** SRP balance -> months of free activation. */
export const SRP_STEPS = [
  { srp: 10, months: 1 },
  { srp: 20, months: 2 },
  { srp: 30, months: 3 },
  { srp: 40, months: 4 },
  { srp: 50, months: 5 },
] as const

export const SRP_PER_SALE = 2
export const SRP_PER_MONTH = 10

export const INCOME_DISCLAIMER =
  "Income depends entirely on genuine product sales and individual effort. VEDORA does not guarantee any earnings and pays no income for recruitment alone. Read the full Compensation Plan and ID Activation Criteria before joining."
