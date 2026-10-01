import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  trigger: ReactNode
  /** e.g. "WD-12" or "3 requests" */
  what: string
  busy?: boolean
  onReject: (remarks: string) => void
}

/** Asks Admin why a withdrawal is rejected — the partner sees the remark in their wallet. */
export function RejectWithdrawalDialog({ trigger, what, busy, onReject }: Props) {
  const [open, setOpen] = useState(false)
  const [remarks, setRemarks] = useState("")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {what}?</DialogTitle>
          <DialogDescription>
            The amount goes back to the partner&apos;s available balance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-remarks" className="eyebrow">
            Reason (shown to the partner)
          </Label>
          <Textarea
            id="reject-remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Bank details don't match the account holder"
          />
        </div>
        <DialogFooter>
          <Button variant="quiet" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => {
              onReject(remarks.trim())
              setOpen(false)
              setRemarks("")
            }}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
