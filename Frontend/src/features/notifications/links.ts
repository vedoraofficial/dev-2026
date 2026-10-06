import { ROUTES } from "@/app/routes"
import type { AppNotification } from "@/features/notifications/types"

type Portal = "admin" | "partner"

/** Where a notification opens when clicked. `null` = nothing to open (e.g. an announcement). */
export function notificationLink(n: Pick<AppNotification, "key">, portal: Portal): string | null {
  if (portal === "admin") {
    switch (n.key) {
      case "ADMIN_WITHDRAWAL_PENDING":
        return ROUTES.admin.withdrawals
      case "PRODUCT_LAUNCHED":
        return ROUTES.admin.products
      case "AUTH_PASSWORD_RESET_DONE":
      case "ACCOUNT_PASSWORD_CHANGED":
      case "ACCOUNT_CONTACT_CHANGED":
        return ROUTES.admin.profile
      default:
        return null
    }
  }
  switch (n.key) {
    case "AUTH_PASSWORD_RESET_DONE":
    case "ACCOUNT_PASSWORD_CHANGED":
      return ROUTES.partner.settings
    case "ACCOUNT_CONTACT_CHANGED":
    case "BANK_ADDED":
    case "BANK_PRIMARY_CHANGED":
    case "BANK_VERIFIED":
      return ROUTES.partner.profile
    case "ACCOUNT_STATUS_CHANGED":
    case "PARTNER_WELCOME":
    case "COMMISSION_MISSED_INACTIVE":
      return ROUTES.partner.dashboard
    case "TEAM_DIRECT_JOINED":
    case "TEAM_SLOTS_ALMOST_FULL":
    case "TEAM_SLOTS_FULL":
      return ROUTES.partner.team
    case "TEAM_DOWNLINE_JOINED":
      return ROUTES.partner.genealogy
    case "ORDER_AWAITING_PAYMENT":
    case "PAYMENT_SUCCESS":
    case "PAYMENT_FAILED":
    case "CASH_ORDER_RECORDED":
    case "ORDER_STATUS_UPDATED":
      return ROUTES.partner.orders
    case "COMMISSION_CREDITED":
    case "WITHDRAWAL_REQUESTED":
    case "WITHDRAWAL_APPROVED":
    case "WITHDRAWAL_REJECTED":
    case "WITHDRAWAL_PAID":
      return ROUTES.partner.wallet
    case "PRODUCT_LAUNCHED":
      return ROUTES.partner.products
    default:
      return null
  }
}
