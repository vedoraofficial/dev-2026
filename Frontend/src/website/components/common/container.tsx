import type { ComponentProps } from "react"

import { cn } from "@/website/lib/utils"

/** Full-width page column with the site's side gutters (no max width, so no empty side bands). */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("w-full safe-x md:px-8 lg:px-12 xl:px-16", className)} {...props} />
}
