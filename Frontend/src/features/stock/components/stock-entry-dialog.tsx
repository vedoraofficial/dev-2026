import { zodResolver } from "@hookform/resolvers/zod"
import { useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/common/form-field"
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
import { useAddStockMovement } from "@/features/stock/queries"
import { stockEntrySchema, type StockEntryValues } from "@/features/stock/schemas"
import type { StockMovementType, StockRow } from "@/features/stock/types"

const blank: StockEntryValues = { quantity: "", note: "" }

/** [Admin] "Add stock" (IN) or "Record sale" (OUT) for one product. */
export function StockEntryDialog({
  row,
  type,
  trigger,
}: {
  row: StockRow
  type: StockMovementType
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const add = useAddStockMovement()
  const isIn = type === "IN"
  const available = row.available
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StockEntryValues>({ resolver: zodResolver(stockEntrySchema), defaultValues: blank })

  const onSubmit = (v: StockEntryValues) => {
    const quantity = Number(v.quantity)
    if (!isIn && quantity > available) {
      setError("quantity", { message: `Only ${available} in stock` })
      return
    }
    add.mutate(
      { productId: row.productId, type, quantity, note: v.note || undefined },
      {
        onSuccess: () => {
          reset(blank)
          setOpen(false)
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(blank)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isIn ? "Add stock" : "Record sale"}</DialogTitle>
          <DialogDescription>
            {row.name} · {available} available now
          </DialogDescription>
        </DialogHeader>
        <form
          id={`stock-${type}-${row.productId}`}
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.stopPropagation()
            void handleSubmit(onSubmit)(e)
          }}
        >
          <FormField
            label={isIn ? "Units received" : "Units sold"}
            htmlFor={`stock-qty-${type}-${row.productId}`}
            error={errors.quantity?.message}
          >
            <Input
              id={`stock-qty-${type}-${row.productId}`}
              inputMode="numeric"
              autoFocus
              placeholder={isIn ? "e.g. 10" : `Up to ${available}`}
              aria-invalid={!!errors.quantity}
              {...register("quantity")}
            />
          </FormField>
          <FormField
            label="Note (optional)"
            htmlFor={`stock-note-${type}-${row.productId}`}
            error={errors.note?.message}
          >
            <Input
              id={`stock-note-${type}-${row.productId}`}
              maxLength={300}
              placeholder={isIn ? "e.g. Batch from supplier" : "e.g. Sold at Pune event"}
              {...register("note")}
            />
          </FormField>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form={`stock-${type}-${row.productId}`}
            variant={isIn ? "default" : "outline"}
            disabled={add.isPending}
          >
            {add.isPending ? "Saving…" : isIn ? "Add stock" : "Record sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
