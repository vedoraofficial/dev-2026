import {
  ArrowLeftRight,
  Boxes,
  ChartColumn,
  Coins,
  Crown,
  FileText,
  House,
  LayoutDashboard,
  Network,
  Package,
  ShoppingBag,
  ShoppingCart,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { ROUTES } from "@/app/routes"

export type NavItem = { label: string; to: string; icon: LucideIcon }

/** Sidebar order follows the approved design. */
export const ADMIN_NAV: NavItem[] = [
  { label: "Overview", to: ROUTES.admin.overview, icon: House },
  { label: "Partners", to: ROUTES.admin.partners, icon: Users },
  { label: "Founders", to: ROUTES.admin.founders, icon: Crown },
  { label: "Genealogy Viewer", to: ROUTES.admin.genealogy, icon: Network },
  { label: "Products", to: ROUTES.admin.products, icon: Package },
  { label: "Stock", to: ROUTES.admin.stock, icon: Boxes },
  { label: "Orders", to: ROUTES.admin.orders, icon: ShoppingCart },
  { label: "Withdrawals", to: ROUTES.admin.withdrawals, icon: Wallet },
  { label: "Income Reports", to: ROUTES.admin.incomeReports, icon: ChartColumn },
  { label: "Transactions", to: ROUTES.admin.transactions, icon: ArrowLeftRight },
  // "Settings" is deliberately not in the sidebar — it's reached from the profile menu
  // next to the notification bell (see components/common/user-menu.tsx).
]

export const PARTNER_NAV: NavItem[] = [
  { label: "Dashboard", to: ROUTES.partner.dashboard, icon: LayoutDashboard },
  { label: "Genealogy Tree", to: ROUTES.partner.genealogy, icon: Network },
  { label: "Add Partner", to: ROUTES.partner.manualPlacement, icon: UserPlus },
  { label: "My Team", to: ROUTES.partner.team, icon: Users },
  { label: "Wallet", to: ROUTES.partner.wallet, icon: Wallet },
  { label: "SRP Wallet", to: ROUTES.partner.srpWallet, icon: Coins },
  { label: "Income Reports", to: ROUTES.partner.incomeReports, icon: ChartColumn },
  { label: "Products", to: ROUTES.partner.products, icon: Package },
  { label: "My Orders", to: ROUTES.partner.orders, icon: ShoppingBag },
  // { label: "Profile", to: ROUTES.partner.profile },
  { label: "Policies", to: ROUTES.partner.policies, icon: FileText },
  // "Settings" is deliberately not in the sidebar — it's reached from the profile menu
  // next to the notification bell (see components/common/user-menu.tsx).
]
