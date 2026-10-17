import balance from "@/assets/images/bracelet-balance.jpg"
import energy from "@/assets/images/bracelet-energy.jpg"
import protection from "@/assets/images/bracelet-protection.jpg"
import wealth from "@/assets/images/bracelet-wealth.jpg"
import type { ProductSlug } from "./types"

export type BraceletArt = {
  slug: ProductSlug
  name: string
  shortName: string
  image: string
  gemstones: string[]
  description: string
}

/**
 * Natural gemstone bracelet artwork and stone descriptions.
 * Matched by product name ("Protection", "Energy", "Wealth", "Balance").
 */
export const braceletArtwork: BraceletArt[] = [
  {
    slug: "protection",
    name: "VEDORA Protection Bracelet",
    shortName: "Protection Bracelet",
    image: protection,
    gemstones: ["Pyrite", "Tiger Eye", "Black Onyx"],
    description:
      "Handcrafted from black onyx, pyrite and tiger eye, the VEDORA Protection Bracelet is designed for grounding, protection and composure under pressure.",
  },
  {
    slug: "energy",
    name: "VEDORA Energy Bracelet",
    shortName: "Energy Bracelet",
    image: energy,
    gemstones: ["Pyrite", "Tiger Eye", "Sulemani Hakik"],
    description:
      "The VEDORA Energy Bracelet combines pyrite, tiger eye and Sulemani Hakik for sustained focus, vitality and disciplined drive.",
  },
  {
    slug: "wealth",
    name: "VEDORA Wealth Bracelet",
    shortName: "Wealth Bracelet",
    image: wealth,
    gemstones: ["Citrine", "Tiger Eye", "Sulemani Hakik"],
    description:
      "Featuring citrine, tiger eye and Sulemani Hakik, the VEDORA Wealth Bracelet represents abundance, opportunity and grounded ambition.",
  },
  {
    slug: "balance",
    name: "VEDORA Balance Bracelet",
    shortName: "Balance Bracelet",
    image: balance,
    gemstones: ["Pyrite", "Milky Quartz", "Black Obsidian"],
    description:
      "Pairing pyrite, milky quartz and black obsidian, the VEDORA Balance Bracelet brings calm clarity and steady emotional rhythm.",
  },
]
