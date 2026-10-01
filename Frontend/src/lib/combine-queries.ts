/** What <QueryState> needs from a TanStack query. */
export type QueryLike = {
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => unknown
}

/** Treat several queries as one: loading until all arrive, failed if any fails. */
export function combineQueries(...queries: QueryLike[]): QueryLike {
  const failed = queries.find((q) => q.isError)
  return {
    isPending: queries.some((q) => q.isPending),
    isError: !!failed,
    error: failed?.error,
    refetch: () => queries.forEach((q) => q.isError && q.refetch()),
  }
}
