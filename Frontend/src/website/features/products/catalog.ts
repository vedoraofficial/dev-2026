import balanceImage from "@/assets/images/bracelet-balance.jpg"
import energyImage from "@/assets/images/bracelet-energy.jpg"
import protectionImage from "@/assets/images/bracelet-protection.jpg"
import wealthImage from "@/assets/images/bracelet-wealth.jpg"

export type Gemstone = { name: string }

/** One line of the product description, e.g. "Focal Element: …". Physical details only. */
export type BraceletDetail = { label: string; text: string }

export type Bracelet = {
  slug: "protection" | "wealth" | "energy" | "balance"
  name: string
  /** Short style tag shown above the name, e.g. "Black Onyx & Tiger Eye" */
  style: string
  description: string
  details: readonly BraceletDetail[]
  stones: readonly [Gemstone, Gemstone, Gemstone]
  image: string
}

/** One price, one warranty for every bracelet. */
export const BRACELET_PRICE = 1999
/** MRP before the discount — shown struck through next to the price. */
export const BRACELET_MRP = 2499
export const WARRANTY_DAYS = 7

/*
 * Descriptions stick to what the bracelet is made of and how it looks — no claims about money,
 * luck, health or energy (payment gateways reject products sold with such claims).
 */
export const BRACELETS: readonly Bracelet[] = [
  {
    slug: "protection",
    name: "VEDORA PYRITE LEGACY",
    style: "Black Onyx & Tiger Eye",
    description:
      "This unisex beaded stretch bracelet features a sophisticated blend of natural gemstones and geometric metallic accents.",
    details: [
      {
        label: "Design & Layout",
        text: "Built on an elastic band, the bracelet features a central focal bead surrounded by a symmetrical arrangement of natural stone beads.",
      },
      {
        label: "Focal Element",
        text: "A gold-tone, faceted pyrite bead serving as a geometric centre point that catches the light from multiple angles.",
      },
      {
        label: "Secondary Accent",
        text: "Four golden-brown Tiger's Eye beads (two flanking each side of the centre bead) displaying their signature chatoyant, silky sheen.",
      },
      {
        label: "Base Beads",
        text: "High-polish, smooth black onyx round beads that complete the rest of the band.",
      },
      {
        label: "Style & Aesthetic",
        text: "Elegant, earthy and modern. Perfect for stacking with watches or leather cuffs, or wearing solo for a refined, minimalist statement.",
      },
    ],
    stones: [{ name: "Pyrite" }, { name: "Tiger Eye" }, { name: "Black Onyx" }],
    image: protectionImage,
  },
  {
    slug: "energy",
    name: "VEDORA CITRINE LEGACY",
    style: "Banded Agate & Tiger Eye",
    description:
      "This unisex beaded stretch bracelet combines striking banded agate with Tiger's Eye and a faceted metallic centre.",
    details: [
      {
        label: "Design & Layout",
        text: "Built on an elastic band, the bracelet features a central focal bead with a symmetrical arrangement of natural stone beads.",
      },
      {
        label: "Focal Element",
        text: "A gold-tone, faceted pyrite bead at the centre that catches the light from every angle.",
      },
      {
        label: "Secondary Accent",
        text: "Four golden-brown Tiger's Eye beads, two on each side of the centre bead, with their natural chatoyant sheen.",
      },
      {
        label: "Base Beads",
        text: "Polished Sulemani Hakik (banded agate) beads in black with fine white bands, each with its own natural pattern.",
      },
      {
        label: "Style & Aesthetic",
        text: "Bold, natural and contemporary. Looks great on its own or stacked with a watch or metal bracelet.",
      },
    ],
    stones: [{ name: "Pyrite" }, { name: "Tiger Eye" }, { name: "Sulemani Hakik" }],
    image: energyImage,
  },
  {
    slug: "wealth",
    name: "VEDORA TIGER LEGACY",
    style: "Citrine & Tiger Eye",
    description:
      "This unisex beaded stretch bracelet pairs a warm citrine centre with golden Tiger's Eye and naturally banded agate.",
    details: [
      {
        label: "Design & Layout",
        text: "Built on an elastic band, with a single focal bead at the centre and natural stone beads arranged symmetrically around it.",
      },
      {
        label: "Focal Element",
        text: "A smooth, honey-orange citrine bead with a soft, translucent glow in natural light.",
      },
      {
        label: "Secondary Accent",
        text: "Golden-brown Tiger's Eye beads placed evenly on both sides of the citrine, showing their silky, light-catching sheen.",
      },
      {
        label: "Base Beads",
        text: "Polished Sulemani Hakik (banded agate) beads in deep black with fine natural banding — no two beads are alike.",
      },
      {
        label: "Style & Aesthetic",
        text: "Warm, earthy and refined. An easy everyday piece that pairs well with both casual and formal wear.",
      },
    ],
    stones: [{ name: "Citrine" }, { name: "Tiger Eye" }, { name: "Sulemani Hakik" }],
    image: wealthImage,
  },
  {
    slug: "balance",
    name: "VEDORA QUARTZ LEGACY",
    style: "Milky Quartz & Obsidian",
    description:
      "This unisex beaded stretch bracelet sets soft white quartz against glossy black stone around a faceted metallic centre.",
    details: [
      {
        label: "Design & Layout",
        text: "Built on an elastic band, with a central focal bead and a symmetrical arrangement of contrasting natural stone beads.",
      },
      {
        label: "Focal Element",
        text: "A gold-tone, faceted pyrite bead serving as a bright centre point.",
      },
      {
        label: "Secondary Accent",
        text: "Four milky quartz beads, two on each side of the centre bead, in a soft, cloudy white.",
      },
      {
        label: "Base Beads",
        text: "Smooth, glossy black obsidian round beads that complete the rest of the band.",
      },
      {
        label: "Style & Aesthetic",
        text: "Clean, minimal and high-contrast. A versatile black-and-white piece for everyday wear.",
      },
    ],
    stones: [{ name: "Pyrite" }, { name: "Milky Quartz" }, { name: "Black Obsidian" }],
    image: balanceImage,
  },
]

/** "Pyrite · Tiger Eye · Black Onyx" */
export const stoneLine = (b: Bracelet) => b.stones.map((s) => s.name).join(" · ")

export const PREMIUM_FEATURES = [
  "100% natural gemstone beads",
  "Unisex premium design",
  "Comfortable stretch fit",
  "Lightweight & durable",
  "Ideal for daily wear and gifting",
] as const

export const CARE_INSTRUCTIONS = [
  "Avoid perfumes, chemicals and excessive water.",
  "Clean gently with a soft, dry cloth.",
  "Store in a cool, dry place after use.",
] as const

export const NATURAL_VARIATION_NOTE =
  "Natural stones vary slightly in colour, pattern and bead size. This is not a defect."

export const WARRANTY_AND_ORDERING = [
  "7-day warranty against manufacturing defects from the date of delivery. Report damaged packages within 48 hours with photos and an unboxing video.",
  "Prepaid orders only — UPI, cards and net banking via Razorpay. GST invoice with every order.",
  "Dispatch within 24–48 business hours. Delivery up to 7 days in Maharashtra, up to 14 days elsewhere.",
] as const
