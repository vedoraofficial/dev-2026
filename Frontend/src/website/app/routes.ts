/** Single source of truth for URLs. Use these instead of hard-coded strings. */
export const ROUTES = {
  home: "/",
  about: "/about",
  products: "/products",
  /** "Become a Partner" — registration only (the business plan is not shown on the site). */
  register: "/register",
  contact: "/contact",
  privacy: "/privacy-policy",
  /** Grievance Redressal lives on the contact page. */
  grievance: "/contact#grievance",
  becomePartner: "/register",
  /** Old Business Opportunity URL — only redirects to `register` now. */
  oldBusiness: "/business-opportunity",
  founders: "/about#founders",
  /** "Partner Login" — the portal sign-in page, in this same app. */
  portalLogin: "/login",
} as const
