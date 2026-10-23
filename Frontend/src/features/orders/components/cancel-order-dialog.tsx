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
import { orderNo } from "@/features/orders/labels"
import { useCancelOrder } from "@/features/orders/queries"
import type { ApiOrder } from "@/features/orders/types"
import { formatINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

type Props = {
  trigger: ReactNode
  order: Pick<ApiOrder, "id" | "paymentStatus" | "totalAmount">
  onCancelled?: () => void
}

/** POST /api/order/:id/cancel, with an optional reason. Paid orders say they will be refunded. */
export function CancelOrderDialog({ trigger, order, onCancelled }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const cancel = useCancelOrder()
  const paid = order.paymentStatus === "PAID"

  const submit = () =>
    cancel.mutate(
      { id: order.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false)
          setReason("")
          onCancelled?.()
        },
      },
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel {orderNo(order.id)}?</DialogTitle>
          <DialogDescription>
            {paid
              ? `${formatINR(paiseToRupees(order.totalAmount))} goes back to the buyer's wallet, the uplines' commissions on it are reversed and the stock is returned.`
              : "The order hasn't been paid, so nothing is charged or refunded."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason" className="eyebrow">
            Reason (optional)
          </Label>
          <Textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={paid ? "e.g. Out of stock at the warehouse" : "e.g. Ordered by mistake"}
          />
        </div>
        <DialogFooter>
          <Button variant="quiet" onClick={() => setOpen(false)}>
            Keep order
          </Button>
          <Button variant="destructive" disabled={cancel.isPending} onClick={submit}>
            {cancel.isPending ? "Cancelling…" : paid ? "Cancel & refund" : "Cancel order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
