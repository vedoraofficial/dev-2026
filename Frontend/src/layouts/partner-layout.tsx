import { Outlet } from "react-router-dom"

/** Shell for the Partner & Founder portal — sidebar + topbar go here when the design is built. */
export function PartnerLayout() {
  return (
    <div className="min-h-svh">
      <Outlet />
    </div>
  )
}
