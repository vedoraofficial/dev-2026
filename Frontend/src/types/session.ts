/** Roles as the backend sends them. */
export type UserRole = "ADMIN" | "FOUNDER" | "PARTNER"

/** The signed-in user, as returned by POST /api/auth/login. */
export type SessionUser = {
  id: number
  name: string
  email: string | null
  role: UserRole
  vedId: string
}

/** How each role is shown in the UI (sidebar card, account menu). */
export const roleLabel: Record<UserRole, string> = {
  ADMIN: "Root Admin",
  FOUNDER: "Founder",
  PARTNER: "Partner",
}
