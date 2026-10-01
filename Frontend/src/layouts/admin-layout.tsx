import { Navigate } from "react-router-dom"

import { ADMIN_NAV } from "@/app/navigation"
import { ROUTES } from "@/app/routes"
import { AppShell } from "@/components/common/app-shell"
import { useSession } from "@/lib/session"
import { roleLabel } from "@/types/session"

/** Shell for the Admin Control Panel — only for a signed-in ADMIN. */
export function AdminLayout() {
  const user = useSession((s) => s.user)

  if (!user) return <Navigate to={ROUTES.login} replace />
  if (user.role !== "ADMIN") return <Navigate to={ROUTES.partner.dashboard} replace />

  return (
    <AppShell
      sectionLabel="Admin control"
      nav={ADMIN_NAV}
      user={{
        name: user.name,
        id: user.vedId,
        role: roleLabel[user.role],
        profileHref: ROUTES.admin.profile,
        settingsHref: ROUTES.admin.settings,
      }}
    />
  )
}
