import { ROUTES } from "@/app/routes"

export type NavItem = { label: string; to: string }

/** Sidebar order follows the approved design. */
export const ADMIN_NAV: NavItem[] = [
  { label: "Overview", to: ROUTES.admin.overview },
  { label: "Partners", to: ROUTES.admin.partners },
  { label: "Founders", to: ROUTES.admin.founders },
  { label: "Genealogy Viewer", to: ROUTES.admin.genealogy },
  { label: "Products", to: ROUTES.admin.products },
  { label: "Orders", to: ROUTES.admin.orders },
  { label: "Withdrawals", to: ROUTES.admin.withdrawals },
  { label: "Income Reports", to: ROUTES.admin.incomeReports },
  { label: "Transactions", to: ROUTES.admin.transactions },
  { label: "Settings", to: ROUTES.admin.settings },
]

export const PARTNER_NAV: NavItem[] = [
  { label: "Dashboard", to: ROUTES.partner.dashboard },
  { label: "Genealogy Tree", to: ROUTES.partner.genealogy },
  { label: "Manual Placement", to: ROUTES.partner.manualPlacement },
  { label: "My Team", to: ROUTES.partner.team },
  { label: "Wallet", to: ROUTES.partner.wallet },
  { label: "SRP Wallet", to: ROUTES.partner.srpWallet },
  { label: "Income Reports", to: ROUTES.partner.incomeReports },
  { label: "Products", to: ROUTES.partner.products },
  { label: "My Orders", to: ROUTES.partner.orders },
  { label: "Profile", to: ROUTES.partner.profile },
  { label: "Policies", to: ROUTES.partner.policies },
  { label: "Settings", to: ROUTES.partner.settings },
]
