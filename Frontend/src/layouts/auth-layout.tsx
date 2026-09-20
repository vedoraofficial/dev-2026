import { Outlet } from "react-router-dom"

/** Shell for logged-out screens (login, registration). */
export function AuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Outlet />
    </main>
  )
}
