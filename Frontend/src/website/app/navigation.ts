import { ROUTES } from "@/website/app/routes"

/** Show "Partner Login" and "Become a Partner" in the header and footer. Hidden for now. */
export const SHOW_PARTNER_LINKS = false

/** Top navigation, in display order. */
export const MAIN_NAV = [
  { label: "Home", to: ROUTES.home },
  { label: "About", to: ROUTES.about },
  { label: "Products", to: ROUTES.products },
  { label: "Contact", to: ROUTES.contact },
] as const

/** Footer "Explore" column. */
export const FOOTER_EXPLORE = [
  { label: "Home", to: ROUTES.home },
  { label: "About VEDORA", to: ROUTES.about },
  { label: "Products", to: ROUTES.products },
  ...(SHOW_PARTNER_LINKS ? [{ label: "Become a Partner", to: ROUTES.becomePartner }] : []),
  { label: "Contact", to: ROUTES.contact },
] as const

/** Footer "Legal" column. */
export const FOOTER_LEGAL = [
  { label: "Privacy Policy", to: ROUTES.privacy },
  { label: "Grievance Redressal", to: ROUTES.grievance },
] as const
