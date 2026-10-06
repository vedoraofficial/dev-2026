import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAdminVerifyBank } from "@/features/account/queries"

type Props = {
  /** The bank to review; `null` closes the dialog */
  bankId: number | null
  /** What Admin is looking at, e.g. "Rohit (VED000418) added HDFC (XX4821), IFSC HDFC0001234." */
  summary: string
  onClose: () => void
  onDone?: () => void
}

/**
 * [Admin] Verify or reject a partner's bank by hand. The backend has no list of banks for Admin,
 * so this opens from the "Bank account to verify" notification, which carries the bank id.
 */
export function BankReviewDialog({ bankId, summary, onClose, onDone }: Props) {
  const review = useAdminVerifyBank()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")

  const close = () => {
    setRejecting(false)
    setReason("")
    onClose()
  }

  const decide = (status: "VERIFIED" | "REJECTED") => {
    if (bankId === null) return
    review.mutate(
      {
        id: bankId,
        status,
        reason: status === "REJECTED" ? reason.trim() || undefined : undefined,
      },
      {
        onSuccess: () => {
          onDone?.()
          close()
        },
      },
    )
  }

  return (
    <Dialog open={bankId !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review bank account</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The partner can withdraw only to a verified account. Check the account holder name against
          the partner&apos;s documents before verifying.
        </p>
        {rejecting ? (
          <div className="space-y-2">
            <Label htmlFor="bank-reject-reason" className="eyebrow">
              Reason (shown to the partner)
            </Label>
            <Textarea
              id="bank-reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Account holder name doesn't match the PAN"
            />
          </div>
        ) : null}
        <DialogFooter>
          {rejecting ? (
            <>
              <Button variant="quiet" onClick={() => setRejecting(false)}>
                Back
              </Button>
              <Button
                variant="destructive"
                disabled={review.isPending}
                onClick={() => decide("REJECTED")}
              >
                {review.isPending ? "Rejecting…" : "Reject account"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={() => setRejecting(true)}>
                Reject
              </Button>
              <Button disabled={review.isPending} onClick={() => decide("VERIFIED")}>
                {review.isPending ? "Verifying…" : "Verify account"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
