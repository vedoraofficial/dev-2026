import { ROUTES } from "@/website/app/routes"

/** Top navigation, in display order. */
export const MAIN_NAV = [
  { label: "Home", to: ROUTES.home },
  { label: "About", to: ROUTES.about },
  { label: "Products", to: ROUTES.products },
  { label: "Business Opportunity", to: ROUTES.business },
  { label: "Contact", to: ROUTES.contact },
] as const

/** Footer "Explore" column. */
export const FOOTER_EXPLORE = [
  { label: "Home", to: ROUTES.home },
  { label: "About VEDORA", to: ROUTES.about },
  { label: "Products", to: ROUTES.products },
  { label: "Business Opportunity", to: ROUTES.business },
  { label: "Contact", to: ROUTES.contact },
] as const

/** Footer "Legal" column. */
export const FOOTER_LEGAL = [
  { label: "Privacy Policy", to: ROUTES.privacy },
  { label: "Grievance Redressal", to: ROUTES.grievance },
] as const
