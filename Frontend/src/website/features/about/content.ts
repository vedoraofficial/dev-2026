export const PILLARS = [
  {
    label: "What we do",
    title: "Make, sell, reward.",
    body: "We source natural stones, handcraft four signature bracelets, and sell them through partners who earn on every genuine sale they and their team make.",
  },
  {
    label: "Vision",
    title: "Energy you can wear.",
    body: "To become India's most trusted natural gemstone brand — known as much for product quality as for the fairness of its partner plan.",
  },
  {
    label: "Mission",
    title: "Income from real sales.",
    body: "To give every partner a transparent, product-first way to earn — no joining fees for income, no reward for recruitment alone.",
  },
] as const

export type Founder = { id: string; name: string; role: string; photo?: string }

/** Founder photos are still to come — cards show a placeholder until `photo` is set. */
export const FOUNDERS: readonly Founder[] = [
  { id: "VED000001", name: "Poonam Amit Medhavi", role: "Founder" },
  { id: "VED000002", name: "Neelam Prashant Dongare", role: "Founder" },
  { id: "VED000003", name: "Shital Pravin Bhor", role: "Founder" },
]

/** Short names used under the founders' quote on the home page. */
export const FOUNDER_SHORT_NAMES = "Poonam Medhavi · Neelam Dongare · Shital Bhor"

export const FOUNDERS_QUOTE =
  "We started VEDORA to make something people would wear every day — and to build a business where honest effort is what gets rewarded."

export const VALUES = [
  {
    title: "Genuine product",
    body: "Natural stones only, honestly described — natural variation is a feature, not a flaw.",
  },
  {
    title: "Fair reward",
    body: "Income comes from sales. Every partner can see exactly how each rupee is earned.",
  },
  {
    title: "Transparency",
    body: "One price, one plan, published policies — nothing hidden in the fine print.",
  },
  {
    title: "Care after sale",
    body: "Warranty, tracked shipping and a grievance process with real timelines.",
  },
] as const

export const COMPLIANCE = [
  "Operates under the Consumer Protection (Direct Selling) Rules, 2021",
  "GST-compliant invoicing on every order",
  "Named Grievance Officer with published resolution timelines",
  "Registration numbers — to be supplied by VEDORA",
] as const
