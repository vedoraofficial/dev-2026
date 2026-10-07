/** Single source of truth for URLs. Use these instead of hard-coded strings. */
export const ROUTES = {
  login: "/login",
  /** Public referral join page: /join/<sponsor VEDORA ID> */
  join: "/join",
  /** Old admin sign-in URL — only redirects to `login` now. */
  adminLogin: "/admin-login",
  /** PhonePe sends the buyer back here after paying (set in the backend's PHONEPE_REDIRECT_URL). */
  paymentStatus: "/payment/status",
  admin: {
    root: "/admin",
    overview: "/admin/overview",
    partners: "/admin/partners",
    founders: "/admin/founders",
    genealogy: "/admin/genealogy",
    products: "/admin/products",
    orders: "/admin/orders",
    withdrawals: "/admin/withdrawals",
    incomeReports: "/admin/income-reports",
    transactions: "/admin/transactions",
    settings: "/admin/settings",
    profile: "/admin/profile",
  },
  partner: {
    root: "/partner",
    dashboard: "/partner/dashboard",
    genealogy: "/partner/genealogy",
    manualPlacement: "/partner/manual-placement",
    team: "/partner/team",
    wallet: "/partner/wallet",
    srpWallet: "/partner/srp-wallet",
    incomeReports: "/partner/income-reports",
    products: "/partner/products",
    orders: "/partner/orders",
    profile: "/partner/profile",
    policies: "/partner/policies",
    settings: "/partner/settings",
  },
} as const
