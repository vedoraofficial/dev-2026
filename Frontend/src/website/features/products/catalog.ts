import balanceImage from "@/assets/images/bracelet-balance.jpg"
import energyImage from "@/assets/images/bracelet-energy.jpg"
import protectionImage from "@/assets/images/bracelet-protection.jpg"
import wealthImage from "@/assets/images/bracelet-wealth.jpg"

export type Gemstone = { name: string; benefits: readonly string[] }

export type Bracelet = {
  slug: "protection" | "wealth" | "energy" | "balance"
  name: string
  intention: string
  description: string
  stones: readonly [Gemstone, Gemstone, Gemstone]
  image: string
}

/** One price, one warranty for every bracelet. */
export const BRACELET_PRICE = 1999
export const WARRANTY_DAYS = 7

const pyrite: Gemstone = {
  name: "Pyrite",
  benefits: [
    "Attracts wealth",
    "Boosts confidence",
    "Enhances willpower",
    "Brings positive energy",
  ],
}

export const BRACELETS: readonly Bracelet[] = [
  {
    slug: "protection",
    name: "VEDORA Protection Bracelet",
    intention: "Strength & Protection",
    description:
      "Designed to inspire strength, confidence and inner peace while adding a bold, elegant touch to everyday style — for those who want to feel focused and resilient.",
    stones: [
      pyrite,
      {
        name: "Tiger Eye",
        benefits: [
          "Improves focus",
          "Builds courage",
          "Supports emotional balance",
          "Brings stability",
        ],
      },
      {
        name: "Black Onyx",
        benefits: [
          "Protection from negative energy",
          "Grounding & stability",
          "Mental strength",
          "Inner peace",
        ],
      },
    ],
    image: protectionImage,
  },
  {
    slug: "wealth",
    name: "VEDORA Wealth Bracelet",
    intention: "Prosperity & Success",
    description:
      "For those who aspire to attract prosperity, confidence and new opportunities while keeping a stylish everyday look.",
    stones: [
      {
        name: "Citrine",
        benefits: [
          "Attracts wealth",
          "Brings abundance",
          "Enhances success",
          "Increases confidence",
        ],
      },
      {
        name: "Tiger Eye",
        benefits: ["Improves focus", "Builds courage", "Brings stability", "Sharpens decisions"],
      },
      {
        name: "Sulemani Hakik",
        benefits: ["Absorbs negative energy", "Mental clarity", "Enhances patience", "Grounding"],
      },
    ],
    image: wealthImage,
  },
  {
    slug: "energy",
    name: "VEDORA Energy Bracelet",
    intention: "Confidence & Focus",
    description:
      "Created for people who want to wear confidence, focus and positivity every day, finished with a premium stretch fit.",
    stones: [
      pyrite,
      {
        name: "Tiger Eye",
        benefits: ["Improves focus", "Builds courage", "Emotional balance", "Encourages stability"],
      },
      {
        name: "Sulemani Hakik",
        benefits: [
          "Absorbs negative energy",
          "Mental clarity",
          "Enhances patience",
          "Peace & protection",
        ],
      },
    ],
    image: energyImage,
  },
  {
    slug: "balance",
    name: "VEDORA Balance Bracelet",
    intention: "Calm & Grounding",
    description:
      "Designed to help you feel calm, focused and grounded — thoughtfully made for people who seek balance in daily life.",
    stones: [
      pyrite,
      {
        name: "Milky Quartz",
        benefits: ["Calms the mind", "Mental clarity", "Emotional balance", "Enhances intuition"],
      },
      {
        name: "Black Obsidian",
        benefits: [
          "Protection from negativity",
          "Grounding & stability",
          "Removes mental blocks",
          "Inner strength",
        ],
      },
    ],
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
  "Prepaid orders only — UPI, cards and net banking via Razorpay or PhonePe. GST invoice with every order.",
  "Dispatch within 24–48 business hours. Delivery up to 7 days in Maharashtra, up to 14 days elsewhere.",
] as const
