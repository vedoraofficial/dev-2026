import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateCashOrder } from "@/features/orders/queries"
import { cashOrderSchema, type CashOrderValues } from "@/features/orders/schemas"
import { formatINR } from "@/lib/format"

type ProductOption = { id: number; name: string; priceRupees: number }

const blank: CashOrderValues = { userId: "", productId: "", quantity: "1" }

/** Admin: record an order paid in cash — confirmed at once, commissions go out immediately. */
export function CashOrderDialog({ products }: { products: ProductOption[] }) {
  const [open, setOpen] = useState(false)
  const cashOrder = useCreateCashOrder()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CashOrderValues>({ resolver: zodResolver(cashOrderSchema), defaultValues: blank })

  const onSubmit = (v: CashOrderValues) =>
    cashOrder.mutate(
      { userId: Number(v.userId), productId: Number(v.productId), quantity: Number(v.quantity) },
      {
        onSuccess: () => {
          reset(blank)
          setOpen(false)
        },
      },
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Cash order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a cash order</DialogTitle>
          <DialogDescription>
            The order is confirmed straight away and commissions are paid to the uplines.
          </DialogDescription>
        </DialogHeader>
        <form id="cash-order" className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="User ID" htmlFor="cash-user" error={errors.userId?.message}>
            <Input
              id="cash-user"
              inputMode="numeric"
              placeholder="e.g. 12"
              aria-invalid={!!errors.userId}
              {...register("userId")}
            />
            <p className="text-[0.6875rem] text-muted-foreground">
              The numeric account ID (not the VEDORA ID) — shown in each order&apos;s details.
            </p>
          </FormField>
          <FormField label="Product" htmlFor="cash-product" error={errors.productId?.message}>
            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger id="cash-product" className="w-full">
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} · {formatINR(p.priceRupees)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Quantity" htmlFor="cash-qty" error={errors.quantity?.message}>
            <Input
              id="cash-qty"
              inputMode="numeric"
              aria-invalid={!!errors.quantity}
              {...register("quantity")}
            />
          </FormField>
        </form>
        <DialogFooter>
          <Button type="submit" form="cash-order" disabled={cashOrder.isPending}>
            {cashOrder.isPending ? "Saving…" : "Create cash order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
