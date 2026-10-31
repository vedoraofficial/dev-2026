import { CircleAlert } from "lucide-react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"

/**
 * For a partner added with "pay later": their ID stays inactive until they pay the joining order
 * from My Orders — then they earn and can add partners.
 */
export function InactiveIdNotice() {
  return (
    <Panel className="flex flex-wrap items-center gap-4 border-warning/40 bg-warning-soft/30">
      <CircleAlert className="size-8 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1">
        <h2 className="text-[0.9375rem] font-medium">Your ID is inactive</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Pay for your joining order to activate it — then you start earning and can add partners to
          your team.
        </p>
      </div>
      <Button asChild>
        <Link to={ROUTES.partner.orders}>Pay now in My Orders</Link>
      </Button>
    </Panel>
  )
}
