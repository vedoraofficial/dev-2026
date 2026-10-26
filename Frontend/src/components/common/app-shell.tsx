import { LogOut, Settings } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"

import type { NavItem } from "@/app/navigation"
import { Logo } from "@/components/common/logo"
import { MonoId } from "@/components/common/mono-id"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { PortalUserProvider, type PortalUser } from "@/lib/portal-user"
import { useShellStore } from "@/lib/shell-store"
import { useLogOut } from "@/lib/use-log-out"
import { cn } from "@/lib/utils"

type Props = {
  /** Small caption above the menu, e.g. "Admin control" */
  sectionLabel: string
  nav: NavItem[]
  user: PortalUser
}

function SidebarBody({
  sectionLabel,
  nav,
  user,
  onNavigate,
  accountActions = false,
}: Props & {
  onNavigate?: () => void
  /** Settings + Log out under the profile card — phones have no avatar menu in the header */
  accountActions?: boolean
}) {
  const logOut = useLogOut()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[4.5rem] shrink-0 items-center border-b border-sidebar-border px-5">
        <Logo />
      </div>

      <nav aria-label={sectionLabel} className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 eyebrow text-[0.625rem]">{sectionLabel}</p>
        <ul className="space-y-1">
          {nav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-full border px-3.5 py-2.5 text-[0.875rem] transition-colors",
                    isActive
                      ? "border-gold/70 bg-linear-to-r from-gold/30 to-gold/5 font-medium text-foreground"
                      : "border-transparent text-foreground/80 hover:bg-white/5 hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      aria-hidden
                      className={cn("size-[1.125rem] shrink-0", isActive && "text-gold-light")}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <NavLink
          to={user.profileHref}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl border border-border bg-white/5 px-3 py-2.5 transition-colors hover:border-gold/40"
        >
          <PersonAvatar
            tone={user.role === "Root Admin" ? "gold" : "striped"}
            size="sm"
            src={user.photo}
            alt={user.name}
          />
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium">{user.name}</p>
            <MonoId tone="gold" className="text-[0.6875rem]">
              {user.id}
            </MonoId>
          </div>
        </NavLink>
        {accountActions ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NavLink
              to={user.settingsHref}
              onClick={onNavigate}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white/5 px-3 py-2.5 text-[0.8125rem] transition-colors hover:border-gold/40"
            >
              <Settings aria-hidden className="size-4" />
              Settings
            </NavLink>
            <button
              type="button"
              onClick={() => {
                onNavigate?.()
                logOut()
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white/5 px-3 py-2.5 text-[0.8125rem] text-danger-on-deep transition-colors hover:border-danger-on-deep/50"
            >
              <LogOut aria-hidden className="size-4" />
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Sidebar + content frame shared by the Admin and Partner portals.
 * Desktop (lg+): fixed sidebar. Tablet / phone: the sidebar becomes a slide-in drawer.
 * The signed-in `user` is made available to every page via `usePortalUser()`.
 */
export function AppShell(props: Props) {
  const open = useShellStore((s) => s.mobileNavOpen)
  const setOpen = useShellStore((s) => s.setMobileNavOpen)

  return (
    <div className="min-h-svh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border surface-deep lg:block">
        <SidebarBody {...props} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          // text-foreground replaces the sheet's dark popover text, so plain text reads on the green
          className="w-[18.5rem] max-w-[85vw] gap-0 border-sidebar-border p-0 surface-deep text-foreground sm:max-w-[18.5rem]"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
          <SidebarBody {...props} onNavigate={() => setOpen(false)} accountActions />
        </SheetContent>
      </Sheet>

      <div className="min-w-0">
        <PortalUserProvider user={props.user}>
          <Outlet />
        </PortalUserProvider>
      </div>
    </div>
  )
}
