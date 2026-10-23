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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateShipment } from "@/features/shipping/queries"

type Props = {
  trigger: ReactNode
  orderId: number
  /** e.g. "ORD-00042" */
  orderLabel: string
}

/** Placeholders are the backend's defaults when a size is left empty. */
const FIELDS = [
  { key: "length", label: "Length (cm)", placeholder: "10" },
  { key: "breadth", label: "Breadth (cm)", placeholder: "10" },
  { key: "height", label: "Height (cm)", placeholder: "10" },
  { key: "weight", label: "Weight (kg)", placeholder: "0.5" },
] as const

type Size = Record<(typeof FIELDS)[number]["key"], string>

/** [Admin] Book a Shiprocket courier for a paid order. Sizes are optional. */
export function CreateShipmentDialog({ trigger, orderId, orderLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState<Size>({ length: "", breadth: "", height: "", weight: "" })
  const create = useCreateShipment()

  const num = (v: string) => (v.trim() && Number(v) > 0 ? Number(v) : undefined)
  const invalid = Object.values(size).some((v) => v.trim() !== "" && !(Number(v) > 0))

  const submit = () =>
    create.mutate(
      {
        orderId,
        length: num(size.length),
        breadth: num(size.breadth),
        height: num(size.height),
        weight: num(size.weight),
      },
      { onSuccess: () => setOpen(false) },
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ship {orderLabel}</DialogTitle>
          <DialogDescription>
            Sends the order and the buyer&apos;s profile address to Shiprocket and assigns a
            courier. Leave a size empty to use the default.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`ship-${f.key}`} className="eyebrow">
                {f.label}
              </Label>
              <Input
                id={`ship-${f.key}`}
                inputMode="decimal"
                placeholder={f.placeholder}
                value={size[f.key]}
                onChange={(e) =>
                  setSize((s) => ({ ...s, [f.key]: e.target.value.replace(/[^\d.]/g, "") }))
                }
              />
            </div>
          ))}
        </div>
        {invalid ? (
          <p className="text-[0.6875rem] text-danger">Sizes must be more than 0.</p>
        ) : null}
        <DialogFooter>
          <Button variant="quiet" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={invalid || create.isPending} onClick={submit}>
            {create.isPending ? "Booking courier…" : "Create shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
