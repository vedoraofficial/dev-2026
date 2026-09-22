import { ADMIN_NAV } from "@/app/navigation"
import { ROUTES } from "@/app/routes"
import { AppShell } from "@/components/common/app-shell"

/** Shell for the Admin Control Panel. The signed-in user is fixed to Root Admin until auth exists. */
export function AdminLayout() {
  return (
    <AppShell
      sectionLabel="Admin control"
      nav={ADMIN_NAV}
      user={{
        name: "Root Admin",
        id: "VED108",
        role: "Root Admin",
        profileHref: ROUTES.admin.profile,
        settingsHref: ROUTES.admin.settings,
      }}
    />
  )
}
