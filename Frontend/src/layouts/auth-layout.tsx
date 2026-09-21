import { Outlet } from "react-router-dom"

/** Shell for logged-out screens (login). Each screen owns its full-page layout. */
export function AuthLayout() {
  return (
    <main className="min-h-svh">
      <Outlet />
    </main>
  )
}
