import { RefreshCw } from "lucide-react"
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"

/**
 * Route-level error screen (React Router's `ErrorBoundary`).
 *
 * The most common case in dev is a stale/dead dev server: the browser tab tries to fetch a
 * page's JS chunk from a Vite server that has since restarted, and gets
 * "Failed to fetch dynamically imported module". Reloading always fixes that one.
 */
export function RouteError() {
  const error = useRouteError()

  const isChunkLoadError =
    error instanceof Error && /dynamically imported module|failed to fetch/i.test(error.message)
  const status = isRouteErrorResponse(error) ? error.status : null

  const title = isChunkLoadError
    ? "This page needs a reload"
    : status === 404
      ? "Page not found"
      : "Something went wrong"

  const description = isChunkLoadError
    ? "The app was updated (or the dev server restarted) after this tab was opened. Reload to get the current version."
    : status === 404
      ? "That page doesn't exist."
      : "An unexpected error occurred while loading this page."

  return (
    <div className="grid min-h-svh place-items-center safe-x">
      <div className="max-w-sm text-center">
        <p className="font-display text-2xl">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw />
            Reload
          </Button>
          <Button variant="quiet" asChild>
            <Link to={ROUTES.login}>Back to login</Link>
          </Button>
        </div>
        {import.meta.env.DEV && error instanceof Error ? (
          <pre className="mt-6 overflow-x-auto rounded-xl border border-border bg-field/60 p-3 text-left text-[0.6875rem] text-muted-foreground">
            {error.message}
          </pre>
        ) : null}
      </div>
    </div>
  )
}
