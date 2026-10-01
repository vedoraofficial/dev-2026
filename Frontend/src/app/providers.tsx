import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { queryClient } from "@/lib/query-client"

/** The app is dark-only: `<html class="dark">` is set in index.html, so there is no theme provider. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster richColors />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
