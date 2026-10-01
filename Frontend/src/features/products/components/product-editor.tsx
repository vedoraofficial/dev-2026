import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FormField } from "@/components/common/form-field"
import { MonoId } from "@/components/common/mono-id"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { productArt, productCode } from "@/features/products/catalog"
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/features/products/queries"
import {
  blankProduct,
  formToProduct,
  productSchema,
  productToForm,
  type ProductFormValues,
} from "@/features/products/schemas"
import type { ApiProduct } from "@/features/products/types"

type Props = {
  /** Leave out to add a new product */
  product?: ApiProduct
  /** Line under the form, e.g. "42 sold" */
  soldLabel?: string
  /** Called after a new product is created, or when adding is cancelled */
  onDone?: () => void
}

/**
 * Admin's edit card for one product — same layout as the catalogue card, but every field is a real
 * input saved to the backend (PATCH /api/product/:id), plus delete. Without `product` it adds one.
 */
export function ProductEditor({ product, soldLabel, onDone }: Props) {
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const remove = useDeleteProduct()
  const isNew = !product
  const id = product?.id ?? 0

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    values: product ? productToForm(product) : blankProduct,
  })
  const name = useWatch({ control, name: "name" })
  const art = productArt(name ?? "")
  const saving = create.isPending || update.isPending

  const onSubmit = (v: ProductFormValues) => {
    if (isNew) create.mutate(formToProduct(v), { onSuccess: () => onDone?.() })
    else update.mutate({ id, ...formToProduct(v) })
  }

  const field = (key: string) => `${isNew ? "new" : id}-${key}`

  return (
    <Panel className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-5 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <img
        src={art.image}
        alt={name || "New product"}
        loading="lazy"
        width={1000}
        height={750}
        className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
      />

      <form className="flex min-w-0 flex-col gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex items-center justify-between gap-3">
          <MonoId tone="gold" className="text-[0.6875rem]">
            {isNew ? "New product" : productCode(id)}
          </MonoId>
          <Controller
            control={control}
            name="active"
            render={({ field: f }) => (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                {f.value ? "Live" : "Draft"}
                <Switch
                  checked={f.value}
                  onCheckedChange={f.onChange}
                  aria-label="Live for partners"
                />
              </label>
            )}
          />
        </div>

        <FormField label="Name" htmlFor={field("name")} error={errors.name?.message}>
          <Input id={field("name")} aria-invalid={!!errors.name} {...register("name")} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="MRP (₹)" htmlFor={field("mrp")} error={errors.mrp?.message}>
            <Input
              id={field("mrp")}
              inputMode="decimal"
              aria-invalid={!!errors.mrp}
              {...register("mrp")}
            />
          </FormField>
          <FormField
            label="Sale price (₹)"
            htmlFor={field("sale")}
            error={errors.salePrice?.message}
          >
            <Input
              id={field("sale")}
              inputMode="decimal"
              aria-invalid={!!errors.salePrice}
              {...register("salePrice")}
            />
          </FormField>
          <FormField label="BV" htmlFor={field("bv")} error={errors.bvAmount?.message}>
            <Input
              id={field("bv")}
              inputMode="numeric"
              className="font-mono text-gold"
              aria-invalid={!!errors.bvAmount}
              {...register("bvAmount")}
            />
          </FormField>
        </div>
        <FormField label="Description" htmlFor={field("desc")}>
          <Textarea
            id={field("desc")}
            rows={4}
            className="rounded-xl bg-field/60 text-[0.8125rem] leading-relaxed"
            {...register("description")}
          />
        </FormField>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{soldLabel}</p>
          <div className="flex flex-wrap gap-2">
            {isNew ? (
              <Button type="button" variant="quiet" size="sm" onClick={onDone}>
                Cancel
              </Button>
            ) : (
              <>
                <ConfirmDialog
                  trigger={
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={remove.isPending}
                    >
                      Delete
                    </Button>
                  }
                  title={`Delete ${product.name}?`}
                  description="Partners will no longer see it. Past orders keep their details."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={() => remove.mutate(id)}
                />
                {isDirty ? (
                  <Button type="button" variant="quiet" size="sm" onClick={() => reset()}>
                    Discard
                  </Button>
                ) : null}
              </>
            )}
            <Button type="submit" size="sm" disabled={saving || (!isNew && !isDirty)}>
              {saving ? "Saving…" : isNew ? "Add product" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  )
}
