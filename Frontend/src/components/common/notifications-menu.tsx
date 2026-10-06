import { Bell } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BankReviewDialog } from "@/features/account/components/bank-review-dialog"
import { notificationLink } from "@/features/notifications/links"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications/queries"
import type { AppNotification } from "@/features/notifications/types"
import { timeAgo } from "@/lib/date"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

const PAGE = 20

/** The bell in the topbar — the signed-in user's notifications from the backend. */
export function NotificationsMenu() {
  const navigate = useNavigate()
  const portal = useSession((s) => (s.user?.role === "ADMIN" ? "admin" : "partner"))
  const [open, setOpen] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [review, setReview] = useState<{ bankId: number; summary: string } | null>(null)

  const unread = useUnreadCount()
  const list = useNotifications({ page: 1, limit }, open)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unreadCount = list.data?.unreadCount ?? unread.data ?? 0
  const items = list.data?.items ?? []
  const hasMore = (list.data?.total ?? 0) > items.length && limit < 100

  const bankToReview = (n: AppNotification) =>
    portal === "admin" && n.key === "ADMIN_BANK_TO_VERIFY" && n.metadata?.bankId != null
      ? Number(n.metadata.bankId)
      : null

  const openItem = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id)
    const bankId = bankToReview(n)
    if (bankId !== null) {
      setOpen(false)
      setReview({ bankId, summary: n.message })
      return
    }
    const link = notificationLink(n, portal)
    if (link) {
      setOpen(false)
      navigate(link)
    }
  }

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setLimit(PAGE)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="quiet"
            size="icon"
            className="relative bg-card"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          >
            <Bell />
            {unreadCount > 0 ? (
              <span
                aria-hidden
                className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.5625rem] font-bold text-primary-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[21rem] max-w-[calc(100vw-2rem)] p-0">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <p className="text-[0.8125rem] font-medium">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-gold hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">All caught up</span>
            )}
          </div>

          <QueryState
            query={list}
            rows={3}
            className="p-4"
            empty={items.length === 0}
            emptyMessage="No notifications yet."
          >
            <ul className="max-h-[22rem] overflow-y-auto">
              {items.map((n) => {
                const review = bankToReview(n) !== null
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={cn(
                        "flex w-full items-start gap-2.5 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40",
                        !n.isRead && "bg-accent/40",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          n.isRead ? "bg-transparent" : "bg-gold",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-[0.8125rem]",
                            n.isRead ? "text-foreground/80" : "font-medium text-foreground",
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="mt-0.5 block text-[0.6875rem] break-words text-muted-foreground">
                          {n.message}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-[0.625rem] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                          {review ? (
                            <span className="font-medium text-gold">Review account →</span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {hasMore ? (
              <button
                type="button"
                onClick={() => setLimit((l) => Math.min(100, l + PAGE))}
                disabled={list.isFetching}
                className="w-full border-t border-border/70 py-2.5 text-xs font-medium text-gold hover:bg-muted/40 disabled:opacity-50"
              >
                {list.isFetching ? "Loading…" : "Show older"}
              </button>
            ) : null}
          </QueryState>
        </PopoverContent>
      </Popover>

      {portal === "admin" ? (
        <BankReviewDialog
          bankId={review?.bankId ?? null}
          summary={review?.summary ?? ""}
          onClose={() => setReview(null)}
        />
      ) : null}
    </>
  )
}
