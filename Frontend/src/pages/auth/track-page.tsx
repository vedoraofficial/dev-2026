import { useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { Logo } from "@/components/common/logo"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrackingDetails } from "@/features/shipping/components/tracking-details"
import { usePublicTracking } from "@/features/shipping/queries"

/** Public parcel tracking by AWB number — /track and /track/<AWB>, no sign-in. */
export function TrackPage() {
  const { awb } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(awb ?? "")
  const tracking = usePublicTracking(awb ?? null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const code = input.trim()
    if (code) navigate(`${ROUTES.track}/${encodeURIComponent(code)}`)
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 py-10 safe-x">
      <Link to={ROUTES.login} aria-label="VEDORA sign in">
        <Logo />
      </Link>
      <div>
        <h1 className="font-display text-[2rem] leading-tight font-normal md:text-4xl">
          Track your parcel
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter the AWB number from your shipping SMS or email.
        </p>
      </div>

      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="awb" className="eyebrow">
            AWB number
          </Label>
          <Input
            id="awb"
            inputMode="numeric"
            placeholder="142231908234"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono"
          />
        </div>
        <Button type="submit" disabled={!input.trim()}>
          Track
        </Button>
      </form>

      {awb ? (
        <Panel aria-live="polite">
          <QueryState query={tracking} rows={4}>
            {tracking.data ? <TrackingDetails tracking={tracking.data} /> : null}
          </QueryState>
        </Panel>
      ) : null}
    </div>
  )
}
