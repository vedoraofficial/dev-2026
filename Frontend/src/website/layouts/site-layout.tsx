import { useEffect } from "react"
import { Outlet, ScrollRestoration } from "react-router-dom"

import { SiteFooter } from "@/website/components/common/site-footer"
import { SiteHeader } from "@/website/components/common/site-header"
import { useHashScroll } from "@/website/hooks/use-hash-scroll"

/** Header + page + footer, shared by every route. */
export function SiteLayout() {
  useHashScroll()

  // The website's base styles (larger text, smooth scrolling) apply under `html.site` only,
  // so the portal screens keep their own sizing.
  useEffect(() => {
    document.documentElement.classList.add("site")
    return () => document.documentElement.classList.remove("site")
  }, [])

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  )
}
