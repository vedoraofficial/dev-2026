import { Loader2 } from "lucide-react"
import type { ComponentType } from "react"
import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { RouteError } from "@/components/common/route-error"
import { AdminLayout } from "@/layouts/admin-layout"
import { AuthLayout } from "@/layouts/auth-layout"
import { PartnerLayout } from "@/layouts/partner-layout"

/** Shown for the instant a lazy page's chunk is still downloading. */
function RouteLoading() {
  return (
    <div className="grid min-h-[60svh] place-items-center">
      <Loader2 className="size-6 animate-spin text-gold" aria-label="Loading" />
    </div>
  )
}

/** Pages are lazy-loaded so each screen is its own chunk. `name` is the page's exported component. */
const page = (load: () => Promise<Record<string, unknown>>, name: string): RouteObject => ({
  lazy: async () => ({ Component: (await load())[name] as ComponentType }),
  HydrateFallback: RouteLoading,
})

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to={ROUTES.login} replace />, ErrorBoundary: RouteError },
  {
    element: <AuthLayout />,
    ErrorBoundary: RouteError,
    children: [
      { path: ROUTES.login, ...page(() => import("@/pages/auth/login-page"), "LoginPage") },
    ],
  },
  {
    path: ROUTES.admin.root,
    element: <AdminLayout />,
    ErrorBoundary: RouteError,
    children: [
      { index: true, element: <Navigate to={ROUTES.admin.overview} replace /> },
      {
        path: "overview",
        ...page(() => import("@/pages/admin/overview-page"), "AdminOverviewPage"),
      },
      {
        path: "partners",
        ...page(() => import("@/pages/admin/partners-page"), "AdminPartnersPage"),
      },
      {
        path: "founders",
        ...page(() => import("@/pages/admin/founders-page"), "AdminFoundersPage"),
      },
      {
        path: "genealogy",
        ...page(() => import("@/pages/admin/genealogy-page"), "AdminGenealogyPage"),
      },
      {
        path: "products",
        ...page(() => import("@/pages/admin/products-page"), "AdminProductsPage"),
      },
      { path: "orders", ...page(() => import("@/pages/admin/orders-page"), "AdminOrdersPage") },
      {
        path: "withdrawals",
        ...page(() => import("@/pages/admin/withdrawals-page"), "AdminWithdrawalsPage"),
      },
      {
        path: "income-reports",
        ...page(() => import("@/pages/admin/income-reports-page"), "AdminIncomeReportsPage"),
      },
      {
        path: "transactions",
        ...page(() => import("@/pages/admin/transactions-page"), "AdminTransactionsPage"),
      },
      {
        path: "settings",
        ...page(() => import("@/pages/admin/settings-page"), "AdminSettingsPage"),
      },
      { path: "profile", ...page(() => import("@/pages/admin/profile-page"), "AdminProfilePage") },
    ],
  },
  {
    path: ROUTES.partner.root,
    element: <PartnerLayout />,
    ErrorBoundary: RouteError,
    children: [
      { index: true, element: <Navigate to={ROUTES.partner.dashboard} replace /> },
      {
        path: "dashboard",
        ...page(() => import("@/pages/partner/dashboard-page"), "PartnerDashboardPage"),
      },
      {
        path: "genealogy",
        ...page(() => import("@/pages/partner/genealogy-page"), "PartnerGenealogyPage"),
      },
      {
        path: "manual-placement",
        ...page(
          () => import("@/pages/partner/manual-placement-page"),
          "PartnerManualPlacementPage",
        ),
      },
      { path: "team", ...page(() => import("@/pages/partner/team-page"), "PartnerTeamPage") },
      { path: "wallet", ...page(() => import("@/pages/partner/wallet-page"), "PartnerWalletPage") },
      {
        path: "srp-wallet",
        ...page(() => import("@/pages/partner/srp-wallet-page"), "PartnerSrpWalletPage"),
      },
      {
        path: "income-reports",
        ...page(() => import("@/pages/partner/income-reports-page"), "PartnerIncomeReportsPage"),
      },
      {
        path: "products",
        ...page(() => import("@/pages/partner/products-page"), "PartnerProductsPage"),
      },
      { path: "orders", ...page(() => import("@/pages/partner/orders-page"), "PartnerOrdersPage") },
      {
        path: "profile",
        ...page(() => import("@/pages/partner/profile-page"), "PartnerProfilePage"),
      },
      {
        path: "policies",
        ...page(() => import("@/pages/partner/policies-page"), "PartnerPoliciesPage"),
      },
      {
        path: "settings",
        ...page(() => import("@/pages/partner/settings-page"), "PartnerSettingsPage"),
      },
    ],
  },
])
