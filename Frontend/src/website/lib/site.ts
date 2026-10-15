import { env } from "@/website/lib/env"

/** Company contact details shown in the footer, contact page and policies. */
export const SITE = {
  legalName: "Prashant Dongre",
  phone: "+91 91365 39436",
  email: "support@vedoraofficial.com",
  website: "www.vedoraofficial.com",
  hours: "Mon–Sat · 10:00–18:00 IST",
  address:
    "B/106, Dashmesh Crystal, Behind Panvelkar Sankul, Kharvai, Karjat Road, Badlapur East, Thane, Maharashtra – 421503",
  grievanceOfficer: "VEDORA Customer Support Team",
  year: 2026,
} as const

/** Short brand line in the footer of every page. */
export const DIRECT_SELLING_DISCLAIMER =
  "Handcrafted natural gemstone bracelets, made with care in India. Every order comes with a GST invoice and a 7-day manufacturing defect warranty."

/** wa.me link with an optional pre-filled message. */
export function whatsappLink(message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${env.whatsappNumber}${text}`
}
