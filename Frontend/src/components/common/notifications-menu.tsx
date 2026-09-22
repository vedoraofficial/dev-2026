import { Bell } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { adminNotifications, partnerNotifications } from "@/features/notifications/mock-data"
import { usePortalUser } from "@/lib/portal-user"
import { cn } from "@/lib/utils"

/** The bell in the topbar — opens the notification list for the signed-in portal. */
export function NotificationsMenu() {
  const user = usePortalUser()
  const [items, setItems] = useState(
    user.role === "Root Admin" ? adminNotifications : partnerNotifications,
  )
  const unreadCount = items.filter((n) => !n.read).length

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="quiet"
          size="icon"
          className="relative bg-card"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell />
          {unreadCount > 0 ? (
            <span aria-hidden className="absolute top-2 right-2 size-1.5 rounded-full bg-gold" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[21rem] p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <p className="text-[0.8125rem] font-medium">Notifications</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-gold hover:underline"
            >
              Mark all read
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">All caught up</span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ul className="max-h-[22rem] overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40",
                    !n.read && "bg-accent/40",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-gold",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[0.8125rem]",
                        n.read ? "text-foreground/80" : "font-medium text-foreground",
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-[0.6875rem] text-muted-foreground">
                      {n.detail}
                    </span>
                    <span className="mt-1 block text-[0.625rem] text-muted-foreground">
                      {n.time}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
