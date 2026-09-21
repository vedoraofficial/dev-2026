import { useState } from "react"

import { cn } from "@/lib/utils"

type Props = {
  /** e.g. "Showing 1–7 of 6,482" */
  summary: string
  pages: number
  onPageChange?: (page: number) => void
  className?: string
}

export function TablePagination({ summary, pages, onPageChange, className }: Props) {
  const [page, setPage] = useState(1)

  const go = (next: number) => {
    setPage(next)
    onPageChange?.(next)
  }

  const box =
    "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-xs transition-colors md:h-8 md:min-w-8"

  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">{summary}</p>
      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-current={n === page ? "page" : undefined}
            onClick={() => go(n)}
            className={cn(
              box,
              n === page
                ? "border-gold bg-gold font-medium text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => go(Math.min(pages, page + 1))}
          className={cn(
            box,
            "border-border px-3 text-foreground/85 hover:bg-muted disabled:opacity-40",
          )}
        >
          Next
        </button>
      </nav>
    </div>
  )
}
