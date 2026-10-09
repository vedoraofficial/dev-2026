/** Single source of truth for URLs. Use these instead of hard-coded strings. */
export const ROUTES = {
  home: "/",
  about: "/about",
  products: "/products",
  business: "/business-opportunity",
  contact: "/contact",
  privacy: "/privacy-policy",
  /** Grievance Redressal lives on the contact page. */
  grievance: "/contact#grievance",
  /** "Become a Partner" — the interest form on the business page. */
  becomePartner: "/business-opportunity#register",
  incomePlan: "/business-opportunity#income-plan",
  founders: "/about#founders",
  /** "Partner Login" — the portal sign-in page, in this same app. */
  portalLogin: "/login",
} as const
