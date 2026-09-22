import { createContext, useContext, type ReactNode } from "react"

export type PortalUser = {
  name: string
  id: string
  role: string
  /** Route the "Profile" menu item opens */
  profileHref: string
  settingsHref: string
}

const PortalUserContext = createContext<PortalUser | null>(null)

export function PortalUserProvider({ user, children }: { user: PortalUser; children: ReactNode }) {
  return <PortalUserContext.Provider value={user}>{children}</PortalUserContext.Provider>
}

/** The signed-in Admin or Partner, as set by AdminLayout / PartnerLayout. */
export function usePortalUser(): PortalUser {
  const user = useContext(PortalUserContext)
  if (!user) throw new Error("usePortalUser must be used within a PortalUserProvider")
  return user
}
