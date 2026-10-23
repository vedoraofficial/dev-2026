/** Single source of truth for URLs. Use these instead of hard-coded strings. */
export const ROUTES = {
  login: "/login",
  /** Forgot password: VEDORA ID → OTP by SMS → new password. */
  forgotPassword: "/forgot-password",
  /** Public referral join page: /join/<sponsor VEDORA ID> */
  join: "/join",
  /** Old admin sign-in URL — only redirects to `login` now. */
  adminLogin: "/admin-login",
  /** Payment status verification page. */
  paymentStatus: "/payment/status",
  /** Public parcel tracking: /track/<AWB> */
  track: "/track",
  admin: {
    root: "/admin",
    overview: "/admin/overview",
    partners: "/admin/partners",
    founders: "/admin/founders",
    genealogy: "/admin/genealogy",
    products: "/admin/products",
    stock: "/admin/stock",
    orders: "/admin/orders",
    wallet: "/admin/wallet",
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
