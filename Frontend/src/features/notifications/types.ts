/** Template keys the backend sends (Backend/src/notification/notification.constants.ts). */
export type NotificationKey =
  | "AUTH_PASSWORD_RESET_DONE"
  | "ACCOUNT_PASSWORD_CHANGED"
  | "ACCOUNT_CONTACT_CHANGED"
  | "ACCOUNT_STATUS_CHANGED"
  | "PARTNER_WELCOME"
  | "TEAM_DIRECT_JOINED"
  | "TEAM_DOWNLINE_JOINED"
  | "TEAM_SLOTS_ALMOST_FULL"
  | "TEAM_SLOTS_FULL"
  | "ORDER_AWAITING_PAYMENT"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "CASH_ORDER_RECORDED"
  | "ORDER_STATUS_UPDATED"
  | "COMMISSION_CREDITED"
  | "COMMISSION_MISSED_INACTIVE"
  | "WITHDRAWAL_REQUESTED"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_REJECTED"
  | "WITHDRAWAL_PAID"
  | "BANK_ADDED"
  | "BANK_PRIMARY_CHANGED"
  | "BANK_VERIFIED"
  | "ADMIN_WITHDRAWAL_PENDING"
  | "ADMIN_BANK_TO_VERIFY"
  | "PRODUCT_LAUNCHED"
  | "ANNOUNCEMENT"

/** One row of GET /api/notifications */
export type AppNotification = {
  id: number
  key: NotificationKey | (string & {})
  title: string
  message: string
  /** Extra ids for the screen it points to, e.g. { bankId, userId } */
  metadata: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationsQuery = { page?: number; limit?: number; unreadOnly?: boolean }

export type NotificationsPage = {
  items: AppNotification[]
  total: number
  unreadCount: number
  page: number
  limit: number
  totalPages: number
}

/** POST /api/notifications/announcement — [Admin] */
export type AnnouncementTarget = "ALL" | "ALL_PARTNERS" | "FOUNDER_TEAM"

export type AnnouncementInput = {
  title: string
  message: string
  target: AnnouncementTarget
  /** Required when target is FOUNDER_TEAM */
  founderVedId?: string
}

export type AnnouncementResult = { success: boolean; message: string; recipientCount: number }
