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
import { orderNo } from "@/features/orders/labels"
import { useMarkDelivered } from "@/features/orders/queries"

type Props = {
  trigger: ReactNode
  orderId: number
  onDone?: () => void
}

/** POST /api/order/:id/mark-delivered — [Admin] skips the courier, sets Delivered directly. */
export function MarkDeliveredDialog({ trigger, orderId, onDone }: Props) {
  const [open, setOpen] = useState(false)
  const markDelivered = useMarkDelivered()

  const submit = () =>
    markDelivered.mutate(orderId, {
      onSuccess: () => {
        setOpen(false)
        onDone?.()
      },
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark {orderNo(orderId)} Delivered?</DialogTitle>
          <DialogDescription>
            Sets the order to Delivered right away, without waiting for Shiprocket. Use this only
            when the order was actually delivered by hand or the courier status never updated.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="quiet" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={markDelivered.isPending} onClick={submit}>
            {markDelivered.isPending ? "Marking…" : "Mark Delivered"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
