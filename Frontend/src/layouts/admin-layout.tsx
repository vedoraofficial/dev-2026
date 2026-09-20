import { Outlet } from "react-router-dom"

/** Shell for the Admin Control Panel — sidebar + topbar go here when the design is built. */
export function AdminLayout() {
  return (
    <div className="min-h-svh">
      <Outlet />
    </div>
  )
}
