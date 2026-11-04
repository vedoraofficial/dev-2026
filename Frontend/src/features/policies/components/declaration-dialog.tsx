import { ShieldCheck } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VOLUNTARY_DECLARATION } from "@/features/policies/declaration"

type Props = {
  open: boolean
  /** Called once the declaration box is ticked and "I agree" is pressed */
  onAccept: () => void
}

/**
 * The Voluntary Participation Declaration. It can't be closed (no ×, Esc or tap outside) until
 * its own box is ticked — then "I agree" closes it and accepts.
 */
export function DeclarationDialog({ open, onAccept }: Props) {
  const [ticked, setTicked] = useState(false)

  const accept = () => {
    setTicked(false)
    onAccept()
  }
  // Esc / tap outside only work once the box is ticked, and then they count as "I agree"
  const blockUntilTicked = (e: Event) => {
    if (!ticked) e.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next || !ticked ? null : accept())}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={blockUntilTicked}
        onInteractOutside={blockUntilTicked}
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck aria-hidden className="size-5 text-gold" />
            {VOLUNTARY_DECLARATION.title}
          </DialogTitle>
          <DialogDescription>Please read and accept before joining.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-xl border border-border bg-field/60 p-4 text-[0.8125rem] leading-relaxed">
          {VOLUNTARY_DECLARATION.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <label
          htmlFor="declaration-agree"
          className="flex cursor-pointer items-start gap-2.5 text-[0.8125rem] leading-relaxed font-medium"
        >
          <Checkbox
            id="declaration-agree"
            className="mt-0.5"
            checked={ticked}
            onCheckedChange={(v) => setTicked(v === true)}
          />
          <span>{VOLUNTARY_DECLARATION.confirm}</span>
        </label>

        <DialogFooter>
          <Button type="button" className="w-full sm:w-auto" disabled={!ticked} onClick={accept}>
            I agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
