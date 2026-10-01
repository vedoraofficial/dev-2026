import { AlertCircle } from "lucide-react"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiErrorMessage } from "@/lib/api"
import type { QueryLike } from "@/lib/combine-queries"
import { cn } from "@/lib/utils"

type Props = {
  query: QueryLike
  /** True when the data loaded but there is nothing to show */
  empty?: boolean
  emptyMessage?: ReactNode
  /** Skeleton rows while loading */
  rows?: number
  className?: string
  children: ReactNode
}

/**
 * Loading / error / empty states for anything that comes from the backend.
 * Wrap the part of the screen that needs the data; it renders `children` once it has arrived.
 */
export function QueryState({
  query,
  empty,
  emptyMessage = "Nothing here yet.",
  rows = 3,
  className,
  children,
}: Props) {
  if (query.isPending) {
    return (
      <div className={cn("space-y-2.5", className)} aria-busy="true" aria-label="Loading">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle />
        <AlertTitle>Couldn&apos;t load this</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{apiErrorMessage(query.error)}</span>
          <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (empty) {
    return (
      <p className={cn("py-6 text-center text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    )
  }

  return <>{children}</>
}
