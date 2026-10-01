import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"

type Options<TData, TVars> = {
  /** Toast shown on success — a string, or built from the response. Leave out for no toast. */
  success?: string | ((data: TData, vars: TVars) => string)
  /** Fallback error text when the backend sends none. Errors always toast. */
  error?: string
  /** Queries to refetch after success, e.g. [["wallet"]] refreshes every wallet query. */
  invalidate?: QueryKey[]
  onSuccess?: (data: TData, vars: TVars) => void
}

/**
 * One way to call a backend action from any screen: shows a success / error toast and refreshes
 * the data it changed. `mutationFn` is a function from a feature's `api.ts`.
 */
export function useApiMutation<TData, TVars = void>(
  mutationFn: (vars: TVars) => Promise<TData>,
  { success, error, invalidate = [], onSuccess }: Options<TData, TVars> = {},
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async (data, vars) => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
      if (success) toast.success(typeof success === "function" ? success(data, vars) : success)
      onSuccess?.(data, vars)
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, error))
    },
  })
}
