import { LogOut, Settings, UserRound } from "lucide-react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePortalUser } from "@/lib/portal-user"

/** The avatar circle beside the notification bell — opens Profile / Settings / Log out. */
export function UserMenu() {
  const user = usePortalUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="quiet"
          size="icon"
          aria-label={`Account menu for ${user.name}`}
          className="hidden rounded-full p-0 sm:inline-flex"
        >
          <PersonAvatar tone={user.role === "Root Admin" ? "gold" : "striped"} size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal">
          <PersonAvatar tone={user.role === "Root Admin" ? "gold" : "striped"} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium">{user.name}</p>
            <p className="text-[0.6875rem]">
              <MonoId tone="gold">{user.id}</MonoId>
              <span className="text-muted-foreground"> · {user.role}</span>
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={user.profileHref}>
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={user.settingsHref}>
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild variant="destructive">
          <Link to={ROUTES.login}>
            <LogOut />
            Log out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
