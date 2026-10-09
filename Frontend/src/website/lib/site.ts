import { env } from "@/website/lib/env"

/** Company contact details shown in the footer, contact page and policies. */
export const SITE = {
  email: "support@vedoraofficial.in",
  website: "www.vedoraofficial.in",
  hours: "Mon–Sat · 10:00–18:00 IST",
  address: "To be supplied by VEDORA",
  grievanceOfficer: "VEDORA Customer Support Team",
  year: 2026,
} as const

/** Shown in the footer of every page — required wording for a direct selling entity. */
export const DIRECT_SELLING_DISCLAIMER =
  "VEDORA operates as a direct selling entity under the Consumer Protection (Direct Selling) Rules, 2021. Income depends entirely on genuine product sales and individual effort — there are no guaranteed earnings and no income for recruitment alone."

/** wa.me link with an optional pre-filled message. */
export function whatsappLink(message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${env.whatsappNumber}${text}`
}
