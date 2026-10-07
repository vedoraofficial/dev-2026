import axios from "axios"

import { ROUTES } from "@/app/routes"
import { env } from "@/lib/env"
import { AppError } from "@/lib/errors"
import { useSession } from "@/lib/session"

/**
 * The one axios instance for all backend calls.
 * Never call axios/fetch directly from components — write a function in
 * `features/<name>/api.ts` that uses this client.
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
})

// Every call to our backend carries the signed-in user's JWT.
api.interceptors.request.use((config) => {
  const { token } = useSession.getState()
  const isOwnBackend = !/^https?:\/\//.test(config.url ?? "")
  if (token && isOwnBackend) config.headers.Authorization = `Bearer ${token}`
  return config
})

// An expired or invalid token → sign out and go back to the login page.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const isLoginCall = axios.isAxiosError(error) && error.config?.url === "/auth/login"
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isLoginCall) {
      useSession.getState().signOut()
      if (window.location.pathname !== ROUTES.login) window.location.replace(ROUTES.login)
    }
    return Promise.reject(error)
  },
)

/** The message the backend sent with an error (NestJS: `{ message }`), or a fallback. */
export function apiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Can't reach the server. Check your connection and try again."
    const message: unknown = (error.response.data as { message?: unknown } | undefined)?.message
    if (Array.isArray(message)) return message.join(", ")
    if (typeof message === "string" && message) return message
  }
  // Our own checks (wrong file type, photo too large…) explain themselves.
  if (error instanceof AppError && error.message) return error.message
  return fallback
}
