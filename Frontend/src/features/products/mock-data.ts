import balance from "@/assets/images/bracelet-balance.jpg"
import energy from "@/assets/images/bracelet-energy.jpg"
import protection from "@/assets/images/bracelet-protection.jpg"
import wealth from "@/assets/images/bracelet-wealth.jpg"

/** The 4 fixed SKUs. All are ₹1,999 MRP (GST included) and 1,000 BV. */
export type Product = {
  sku: string
  slug: "protection" | "energy" | "wealth" | "balance"
  name: string
  shortName: string
  image: string
  price: number
  bv: number
  description: string
  gemstones: string[]
  unitsSold: number
  status: "live" | "draft"
}

export const products: Product[] = [
  {
    sku: "SKU-01",
    slug: "protection",
    name: "VEDORA Protection Bracelet",
    shortName: "Protection Bracelet",
    image: protection,
    price: 1999,
    bv: 1000,
    description:
      "Handcrafted from black onyx, pyrite and tiger eye, the VEDORA Protection Bracelet is designed for those who want to feel grounded, guarded and quietly confident through the day. Black onyx is traditionally worn as a stone of grounding and protection, believed to absorb negative energy before it settles in. Pyrite adds a layer of mental clarity and self-belief, while tiger eye brings balance between courage and calm, helping the wearer stay composed under pressure. Every bead is hand-selected and polished to a consistent size, then strung on a premium elastic cord that holds its shape through daily wear — gym sessions, long work days, travel — without losing its stretch. The bracelet sits comfortably on most wrist sizes and suits both men and women, making it an easy everyday piece rather than an occasional accessory. Each unit ships in VEDORA's signature packaging with a short care card: keep it away from harsh chemicals, perfumes and prolonged water exposure to preserve the natural shine of the stones. Backed by a 7-day manufacturing defect warranty, the Protection Bracelet is one of VEDORA's four flagship SKUs, priced at ₹1,999 and worth 1,000 BV on every confirmed sale.",
    gemstones: ["Pyrite", "Tiger Eye", "Black Onyx"],
    unitsSold: 612,
    status: "live",
  },
  {
    sku: "SKU-02",
    slug: "energy",
    name: "VEDORA Energy Bracelet",
    shortName: "Energy Bracelet",
    image: energy,
    price: 1999,
    bv: 1000,
    description:
      "The VEDORA Energy Bracelet is built for people who want to carry focus, positivity and steady drive into every part of their day. Pyrite is worn for confidence and mental clarity, helping cut through distraction and hesitation, while tiger eye is associated with courage, balance and the discipline to follow through on what you start. Sulemani Hakik, a banded agate long valued across South Asia, is traditionally worn for protection and calm, rounding out the trio with a sense of quiet stability beneath the energy. Each bracelet is handcrafted bead by bead, with every stone checked for size and finish before stringing, then set on a durable premium elastic cord engineered to flex through workouts, travel and long working hours without losing its grip. It sits naturally on the wrist for men and women alike, easy to wear from the gym to the office without a second thought. VEDORA ships every unit in branded packaging with simple care instructions — avoid harsh chemicals, perfumes and extended water contact to keep the natural gemstone finish looking new. Like every SKU in the VEDORA lineup, the Energy Bracelet is priced at ₹1,999, generates 1,000 BV on every confirmed sale, and is covered by a 7-day warranty against manufacturing defects, not general wear and tear.",
    gemstones: ["Pyrite", "Tiger Eye", "Sulemani Hakik"],
    unitsSold: 481,
    status: "live",
  },
  {
    sku: "SKU-03",
    slug: "wealth",
    name: "VEDORA Wealth Bracelet",
    shortName: "Wealth Bracelet",
    image: wealth,
    price: 1999,
    bv: 1000,
    description:
      "Citrine sits at the centre of the VEDORA Wealth Bracelet, a stone long associated with abundance, optimism and new opportunity, making it a popular choice for anyone stepping into a new venture or simply wanting a brighter outlook day to day. Tiger eye adds steadiness and self-belief, tempering ambition with patience, while Sulemani Hakik contributes a grounding, protective presence that keeps the overall energy balanced rather than restless. Together the three stones are strung by hand into a comfortable, unisex bracelet suited to daily wear — meetings, travel, workouts — without needing to be taken off. Each bead is individually checked for consistent size and polish before assembly, and the premium elastic cord is chosen specifically for its ability to hold shape and stretch through repeated daily use rather than loosening over time. The Wealth Bracelet ships in VEDORA's standard packaging with a short care card recommending the piece be kept away from harsh chemicals, perfume and prolonged water exposure so the natural stones keep their shine for longer. As with the rest of the VEDORA range, it is priced at ₹1,999 inclusive of GST, generates 1,000 BV toward the compensation plan on every confirmed sale, and carries a 7-day warranty covering manufacturing defects only.",
    gemstones: ["Citrine", "Tiger Eye", "Sulemani Hakik"],
    unitsSold: 433,
    status: "live",
  },
  {
    sku: "SKU-04",
    slug: "balance",
    name: "VEDORA Balance Bracelet",
    shortName: "Balance Bracelet",
    image: balance,
    price: 1999,
    bv: 1000,
    description:
      "The VEDORA Balance Bracelet pairs pyrite, milky quartz and black obsidian for people who want a calmer, more grounded rhythm to their day without giving up focus. Milky quartz is worn for gentle clarity and emotional balance, softening the sharper edges of a busy schedule, while black obsidian is traditionally associated with grounding and protection, helping absorb stress before it builds up. Pyrite rounds out the set with a steady note of confidence and mental clarity, keeping the overall feel calm rather than passive. Every bracelet is handcrafted with hand-checked beads for consistent size and finish, strung on a premium elastic cord built to hold its shape through daily wear, from long work hours to travel days, without stretching out. It fits comfortably across most wrist sizes and works equally well for men and women as an everyday piece rather than an occasion-only accessory. Each unit ships in VEDORA's branded packaging with a short care card advising against harsh chemicals, perfumes and prolonged water exposure to keep the natural gemstone shine intact. Currently listed as a draft SKU pending final review, the Balance Bracelet will carry the same terms as the rest of the VEDORA range once live: ₹1,999 MRP, 1,000 BV per confirmed sale, and a 7-day warranty against manufacturing defects.",
    gemstones: ["Pyrite", "Milky Quartz", "Black Obsidian"],
    unitsSold: 314,
    status: "draft",
  },
]
