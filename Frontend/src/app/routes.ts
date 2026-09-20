/** Single source of truth for URLs. Use these instead of hard-coded strings. */
export const ROUTES = {
  login: "/login",
  admin: {
    root: "/admin",
    overview: "/admin/overview",
    partners: "/admin/partners",
    founders: "/admin/founders",
    manualPlacement: "/admin/manual-placement",
    genealogy: "/admin/genealogy",
    products: "/admin/products",
    withdrawals: "/admin/withdrawals",
    incomeReports: "/admin/income-reports",
    transactions: "/admin/transactions",
    settings: "/admin/settings",
  },
  partner: {
    root: "/partner",
    dashboard: "/partner/dashboard",
    genealogy: "/partner/genealogy",
    team: "/partner/team",
    wallet: "/partner/wallet",
    incomeReports: "/partner/income-reports",
    products: "/partner/products",
    profile: "/partner/profile",
    settings: "/partner/settings",
  },
} as const
