import { useQuery } from "@tanstack/react-query"

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  sendAnnouncement,
} from "@/features/notifications/api"
import type { NotificationsQuery } from "@/features/notifications/types"
import { useApiMutation } from "@/lib/mutation"

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (q: NotificationsQuery) => ["notifications", "list", q] as const,
  unread: ["notifications", "unread"] as const,
}

/** How often the bell checks for new notifications. */
const POLL_MS = 30_000

export const useUnreadCount = () =>
  useQuery({
    queryKey: notificationKeys.unread,
    queryFn: getUnreadCount,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  })

export const useNotifications = (query: NotificationsQuery, enabled = true) =>
  useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => getNotifications(query),
    enabled,
    placeholderData: (previous) => previous,
  })

export const useMarkNotificationRead = () =>
  useApiMutation(markNotificationRead, { invalidate: [notificationKeys.all] })

export const useMarkAllNotificationsRead = () =>
  useApiMutation(markAllNotificationsRead, { invalidate: [notificationKeys.all] })

/** [Admin] */
export const useSendAnnouncement = () =>
  useApiMutation(sendAnnouncement, {
    success: (r) =>
      `Announcement sent to ${r.recipientCount} ${r.recipientCount === 1 ? "person" : "people"}`,
    invalidate: [notificationKeys.all],
  })
