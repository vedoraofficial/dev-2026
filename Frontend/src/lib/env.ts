/**
 * Application environment configuration.
 * In development with Vite proxy or production with reverse proxy, API requests route to `/api`.
 * If VITE_API_BASE_URL contains localhost in a production build, it is safely defaulted to `/api`
 * to prevent accidental breakage in deployed bundles.
 */
const configuredUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api"
const isProduction = import.meta.env.PROD

const resolvedBaseUrl =
  isProduction && (configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1"))
    ? "/api"
    : configuredUrl

export const env = {
  apiBaseUrl: resolvedBaseUrl,
} as const
