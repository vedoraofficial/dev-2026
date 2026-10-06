import { Navigate } from "react-router-dom"

import { PARTNER_NAV } from "@/app/navigation"
import { ROUTES } from "@/app/routes"
import { AppShell } from "@/components/common/app-shell"
import { useProfilePhoto } from "@/features/account/use-profile-photo"
import { useSession } from "@/lib/session"
import { roleLabel } from "@/types/session"

/** Shell for the Partner & Founder portal — for a signed-in FOUNDER or PARTNER. */
export function PartnerLayout() {
  const user = useSession((s) => s.user)
  const photo = useProfilePhoto(!!user && user.role !== "ADMIN")

  if (!user) return <Navigate to={ROUTES.login} replace />
  if (user.role === "ADMIN") return <Navigate to={ROUTES.admin.overview} replace />

  return (
    <AppShell
      sectionLabel="Partner portal"
      nav={PARTNER_NAV}
      user={{
        name: user.name,
        id: user.vedId,
        role: roleLabel[user.role],
        photo: photo.src,
        profileHref: ROUTES.partner.profile,
        settingsHref: ROUTES.partner.settings,
      }}
    />
  )
}
