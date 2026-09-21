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
      "Handcrafted premium bracelet designed to inspire strength, confidence and inner peace while adding a bold, elegant touch to everyday style. Made for those who want to feel confident, focused and resilient.",
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
      "Created for people who want to wear confidence, focus and positivity every day. Handcrafted with carefully selected natural gemstones and a premium stretch-fit finish for comfort and durability.",
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
      "For those who aspire to attract prosperity, confidence and new opportunities while keeping a stylish everyday look. Premium craftsmanship with a comfortable stretch fit, for men and women.",
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
      "Designed to help you feel calm, focused and grounded while adding elegance to everyday style. Thoughtfully made for people who seek balance in daily life.",
    gemstones: ["Pyrite", "Milky Quartz", "Black Obsidian"],
    unitsSold: 314,
    status: "draft",
  },
]
