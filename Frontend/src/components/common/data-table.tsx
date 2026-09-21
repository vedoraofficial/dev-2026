import { Fragment, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export type Column<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** Right-align the column on desktop (amounts, actions) */
  align?: "left" | "right"
  /** Extra classes for the desktop <td> */
  className?: string
  /** Phones: this column becomes the card title */
  primary?: boolean
  /** Buttons. Right-aligned on desktop, card footer on phones. Return the buttons as a fragment. */
  actions?: boolean
}

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string | number
  /** e.g. dim rows that earned nothing */
  rowClassName?: (row: T) => string | undefined
  emptyMessage?: string
  className?: string
}

/**
 * One table definition, two layouts:
 * - md and up: a real <table> (scrolls sideways rather than squashing if space is tight)
 * - phones: a stack of cards, so nothing needs sideways scrolling
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  rowClassName,
  emptyMessage = "Nothing to show yet.",
  className,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <p className={cn("py-10 text-center text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    )
  }

  const primary = columns.find((c) => c.primary)
  const actions = columns.filter((c) => c.actions)
  const details = columns.filter((c) => !c.primary && !c.actions)

  return (
    <div className={className}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] text-left text-[0.8125rem]">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-3 pb-3 eyebrow font-medium first:pl-0 last:pr-0",
                    (c.align === "right" || c.actions) && "text-right",
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className={cn(
                  "border-t border-border/70 transition-colors hover:bg-muted/40",
                  rowClassName?.(row),
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-3.5 align-middle first:pl-0 last:pr-0",
                      c.align === "right" && "text-right",
                      c.className,
                    )}
                  >
                    {c.actions ? (
                      <div className="flex flex-wrap justify-end gap-2">{c.cell(row)}</div>
                    ) : (
                      c.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={getRowKey(row)}
            className={cn("rounded-xl border border-border bg-field/60 p-3.5", rowClassName?.(row))}
          >
            {primary ? <div className="mb-3">{primary.cell(row)}</div> : null}
            {details.length > 0 ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {details.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="eyebrow">{c.header}</dt>
                    <dd className="mt-1 text-[0.8125rem]">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {actions.length > 0 ? (
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
                {actions.map((c) => (
                  <Fragment key={c.key}>{c.cell(row)}</Fragment>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
