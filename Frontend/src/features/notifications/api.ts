import type {
  AnnouncementInput,
  AnnouncementResult,
  NotificationsPage,
  NotificationsQuery,
} from "@/features/notifications/types"
import { api } from "@/lib/api"

/** GET /api/notifications — newest first, with the unread count. */
export async function getNotifications(query: NotificationsQuery = {}): Promise<NotificationsPage> {
  const { data } = await api.get<NotificationsPage>("/notifications", { params: query })
  return { ...data, items: data.items.map((n) => ({ ...n, id: Number(n.id) })) }
}

/** GET /api/notifications/unread-count — for the bell badge. */
export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ unreadCount: number }>("/notifications/unread-count")
  return data.unreadCount
}

/** PATCH /api/notifications/:id/read */
export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

/** PATCH /api/notifications/read-all */
export async function markAllNotificationsRead(): Promise<{ count: number }> {
  const { data } = await api.patch<{ success: boolean; count: number }>("/notifications/read-all")
  return data
}

/** POST /api/notifications/announcement — [Admin] */
export async function sendAnnouncement(input: AnnouncementInput): Promise<AnnouncementResult> {
  const { data } = await api.post<AnnouncementResult>("/notifications/announcement", input)
  return data
}
