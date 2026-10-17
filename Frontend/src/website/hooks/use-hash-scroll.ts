import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/**
 * Scrolls to `#anchor` after navigation. Pages are lazy-loaded, so the target may not exist on the
 * first frame — retry for a short while until it renders.
 */
export function useHashScroll() {
  const { hash, key } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.slice(1))
    let tries = 0
    let timer = 0

    const attempt = () => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        return
      }
      if (tries++ < 20) timer = window.setTimeout(attempt, 50)
    }
    attempt()

    return () => window.clearTimeout(timer)
  }, [hash, key])
}
