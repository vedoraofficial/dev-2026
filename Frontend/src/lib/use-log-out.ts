import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { queryClient } from "@/lib/query-client"
import { useSession } from "@/lib/session"

/** Log out: forget the token and any data cached for this user, then back to sign-in. */
export function useLogOut() {
  const navigate = useNavigate()
  const signOut = useSession((s) => s.signOut)

  return () => {
    signOut()
    queryClient.clear()
    navigate(ROUTES.login, { replace: true })
  }
}
