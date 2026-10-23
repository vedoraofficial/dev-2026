import { useState } from "react"

import { cn } from "@/lib/utils"

type Props = {
  /** e.g. "Showing 1–7 of 6,482" */
  summary: string
  pages: number
  /** Current page, when the page owns it (keeps the highlight right if this row re-mounts) */
  page?: number
  onPageChange?: (page: number) => void
  className?: string
}

/** Page numbers to show: all of them up to 7, otherwise 1 … around the current page … last. */
function pageItems(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const start = Math.max(2, Math.min(page - 1, pages - 3))
  const end = Math.min(pages - 1, Math.max(page + 1, 4))
  const items: (number | "gap")[] = [1]
  if (start > 2) items.push("gap")
  for (let n = start; n <= end; n++) items.push(n)
  if (end < pages - 1) items.push("gap")
  items.push(pages)
  return items
}

export function TablePagination({
  summary,
  pages,
  page: pageProp,
  onPageChange,
  className,
}: Props) {
  const [ownPage, setOwnPage] = useState(1)
  const page = pageProp ?? ownPage

  const go = (next: number) => {
    setOwnPage(next)
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
      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
        {pages > 7 ? (
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => go(Math.max(1, page - 1))}
            className={cn(
              box,
              "border-border px-3 text-foreground/85 hover:bg-muted disabled:opacity-40",
            )}
          >
            Prev
          </button>
        ) : null}
        {pageItems(page, pages).map((n, i) =>
          n === "gap" ? (
            <span key={`gap-${i}`} aria-hidden className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => go(n)}
              className={cn(
                box,
                n === page
                  ? "border-gold bg-gold font-medium text-gold-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {n}
            </button>
          ),
        )}
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
