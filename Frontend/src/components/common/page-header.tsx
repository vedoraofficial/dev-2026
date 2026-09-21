import { Bell, Menu } from "lucide-react"
import type { ReactNode } from "react"

import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import { useShellStore } from "@/lib/shell-store"

type Props = {
  title: string
  subtitle?: ReactNode
  /** Buttons / search shown beside the title (wrap below it on phones) */
  actions?: ReactNode
  /** Hide the notification bell + avatar (e.g. on the genealogy screens that use the space) */
  hideUtilities?: boolean
}

export function PageHeader({ title, subtitle, actions, hideUtilities }: Props) {
  const openNav = useShellStore((s) => s.setMobileNavOpen)

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-sidebar/90 safe-x backdrop-blur md:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 py-3.5 md:py-4">
        <Button
          variant="quiet"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
          onClick={() => openNav(true)}
        >
          <Menu />
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[1.625rem] leading-tight font-medium md:text-[1.875rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {actions ? (
          <div className="order-last flex w-full flex-wrap items-center gap-2 md:order-none md:w-auto md:justify-end [&>*]:min-w-0">
            {actions}
          </div>
        ) : null}

        {hideUtilities ? null : (
          <>
            <Button
              variant="quiet"
              size="icon"
              className="relative bg-card"
              aria-label="Notifications"
            >
              <Bell />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-gold" />
            </Button>
            <PersonAvatar size="md" className="hidden sm:inline-block" />
          </>
        )}
      </div>
    </header>
  )
}

/** Standard content area under a PageHeader. */
export function PageBody({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 py-5 safe-x md:space-y-5 md:px-6 md:py-6 lg:px-8">{children}</div>
  )
}
