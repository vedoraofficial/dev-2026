export const PILLARS = [
  {
    label: "What we do",
    title: "Source, craft, deliver.",
    body: "We source natural stones, handcraft four signature bracelets, and deliver them to customers across India.",
  },
  {
    label: "Vision",
    title: "Energy you can wear.",
    body: "To become India's most trusted natural gemstone brand — known for product quality and honest service.",
  },
  {
    label: "Mission",
    title: "Quality you can see.",
    body: "To offer genuine natural gemstone bracelets at one honest price, with clear policies and reliable after-sale care.",
  },
] as const

export type Founder = { id?: string; name: string; role: string }

/** Owner of VEDORA — shown first in the leadership section. */
export const OWNER: Founder = { name: "Prashant Dongare", role: "Owner" }

export const FOUNDERS: readonly Founder[] = [
  { id: "VED000001", name: "Poonam Medhavi", role: "Founder" },
  { id: "VED000002", name: "Neelam Dongare", role: "Founder" },
  { id: "VED000003", name: "Shital Bhor", role: "Founder" },
]

/** Short names used under the founders' quote on the home page. */
export const FOUNDER_SHORT_NAMES = "Poonam Medhavi · Neelam Dongare · Shital Bhor"

export const FOUNDERS_QUOTE =
  "We started VEDORA to make something people would wear every day — crafted with care and offered at an honest price."

export const VALUES = [
  {
    title: "Genuine product",
    body: "Natural stones only, honestly described — natural variation is a feature, not a flaw.",
  },
  {
    title: "Honest pricing",
    body: "One price for every bracelet, with a GST invoice on every order.",
  },
  {
    title: "Transparency",
    body: "Clear, published policies — nothing hidden in the fine print.",
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
