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
      "This unisex beaded stretch bracelet features a sophisticated blend of natural gemstones and geometric metallic accents. Design & Layout: Built on an elastic band, the bracelet features a central focal bead surrounded by a symmetrical arrangement of natural stone beads. Focal Element: A gold-tone, faceted pyrite bead serving as a geometric centre point that catches the light from multiple angles. Secondary Accent: Four golden-brown Tiger's Eye beads (two flanking each side of the centre bead) displaying their signature chatoyant, silky sheen. Base Beads: High-polish, smooth black onyx round beads that complete the rest of the band. Style & Aesthetic: Elegant, earthy and modern. Perfect for stacking with watches or leather cuffs, or wearing solo for a refined, minimalist statement.",
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
      "This unisex beaded stretch bracelet combines striking banded agate with Tiger's Eye and a faceted metallic centre. Design & Layout: Built on an elastic band, the bracelet features a central focal bead with a symmetrical arrangement of natural stone beads. Focal Element: A gold-tone, faceted pyrite bead at the centre that catches the light from every angle. Secondary Accent: Four golden-brown Tiger's Eye beads, two on each side of the centre bead, with their natural chatoyant sheen. Base Beads: Polished Sulemani Hakik (banded agate) beads in black with fine white bands, each with its own natural pattern. Style & Aesthetic: Bold, natural and contemporary. Looks great on its own or stacked with a watch or metal bracelet.",
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
      "This unisex beaded stretch bracelet pairs a warm citrine centre with golden Tiger's Eye and naturally banded agate. Design & Layout: Built on an elastic band, with a single focal bead at the centre and natural stone beads arranged symmetrically around it. Focal Element: A smooth, honey-orange citrine bead with a soft, translucent glow in natural light. Secondary Accent: Golden-brown Tiger's Eye beads placed evenly on both sides of the citrine, showing their silky, light-catching sheen. Base Beads: Polished Sulemani Hakik (banded agate) beads in deep black with fine natural banding — no two beads are alike. Style & Aesthetic: Warm, earthy and refined. An easy everyday piece that pairs well with both casual and formal wear.",
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
      "This unisex beaded stretch bracelet sets soft white quartz against glossy black stone around a faceted metallic centre. Design & Layout: Built on an elastic band, with a central focal bead and a symmetrical arrangement of contrasting natural stone beads. Focal Element: A gold-tone, faceted pyrite bead serving as a bright centre point. Secondary Accent: Four milky quartz beads, two on each side of the centre bead, in a soft, cloudy white. Base Beads: Smooth, glossy black obsidian round beads that complete the rest of the band. Style & Aesthetic: Clean, minimal and high-contrast. A versatile black-and-white piece for everyday wear.",
    gemstones: ["Pyrite", "Milky Quartz", "Black Obsidian"],
    unitsSold: 314,
    status: "draft",
  },
]

/**
 * Units of each SKU sold by the signed-in partner (sample data). Every partner sees only their
 * own numbers — the real ones come from the API for that partner.
 */
export const partnerUnitsSold: Record<string, number> = {
  "SKU-01": 42,
  "SKU-02": 31,
  "SKU-03": 24,
  "SKU-04": 13,
}
