import { PARTNER_NAV } from "@/app/navigation"
import { ROUTES } from "@/app/routes"
import { AppShell } from "@/components/common/app-shell"

/**
 * Shell for the Partner & Founder portal.
 * The user card is sample data until auth exists — then read it from the session.
 */
export function PartnerLayout() {
  return (
    <AppShell
      sectionLabel="Partner portal"
      nav={PARTNER_NAV}
      user={{
        name: "Rohit Deshmukh",
        id: "VED000418",
        role: "Partner",
        profileHref: ROUTES.partner.profile,
        settingsHref: ROUTES.partner.settings,
      }}
    />
  )
}
