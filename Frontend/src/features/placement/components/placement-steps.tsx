import { useEffect, type ChangeEvent, type ReactNode } from "react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"

import { FieldError, FormField as Field } from "@/components/common/form-field"
import { Panel } from "@/components/common/panel"
import { PriceTag } from "@/components/common/price-tag"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { textareaClass } from "@/features/placement/components/partner-details-fields"
import { AreaSelect, PincodeHint } from "@/features/placement/components/pincode-lookup"
import { ProductPicker, type PickerProduct } from "@/features/placement/components/product-picker"
import { limitDigits } from "@/features/placement/partner-details"
import { isPincode, usePincodeLookup } from "@/features/placement/queries"
import type { JoiningFormInput } from "@/features/placement/schemas"
import { formatBV } from "@/lib/format"

/** Any form that has the partner details + joining order fields (Add Partner, referral join). */
type JoiningForm<T extends JoiningFormInput> = { form: UseFormReturn<T, unknown, unknown> }
const fieldsOf = <T extends JoiningFormInput>(form: UseFormReturn<T, unknown, unknown>) =>
  form as unknown as UseFormReturn<JoiningFormInput>

/** A numbered section of the partner registration form. */
export function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Panel>
      <h2 className="mb-4 flex items-center gap-3 text-[0.9375rem] font-medium">
        <span className="grid size-6 place-items-center rounded-full bg-gold text-xs font-bold text-primary-foreground">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </Panel>
  )
}

/** Pick the bracelet for the joining order. `children` can wrap the picker (e.g. loading state). */
export function JoiningProductStep<T extends JoiningFormInput>({
  n,
  form,
  products,
  wrap = (picker) => picker,
}: JoiningForm<T> & {
  n: number
  products: PickerProduct[]
  /** Wrap the picker, e.g. in a QueryState while the products load */
  wrap?: (picker: ReactNode) => ReactNode
}) {
  const {
    control,
    formState: { errors },
  } = fieldsOf(form)
  return (
    <Step n={n} title="Choose the joining product">
      {wrap(
        <Controller
          control={control}
          name="productSku"
          render={({ field }) => (
            <ProductPicker
              products={products}
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.productSku}
              className="lg:grid-cols-4"
            />
          )}
        />,
      )}
      <FieldError message={errors.productSku?.message} />
      <p className="text-[0.6875rem] text-muted-foreground">
        One product per joining · price incl. GST · BV as set by Admin.
      </p>
    </Step>
  )
}

/** Where the joining order ships — the registered address or another one. */
export function ShippingStep<T extends JoiningFormInput>({
  n,
  form,
  sameAsRegistered,
  onSameAsRegisteredChange,
}: JoiningForm<T> & {
  n: number
  sameAsRegistered: boolean
  onSameAsRegisteredChange: (same: boolean) => void
}) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = fieldsOf(form)
  const [regAddress, regCity, regState, regPincode, regArea, shipPincode] = useWatch({
    control,
    name: ["address", "city", "state", "pincode", "area", "shipPincode"],
  })

  // Shipping pincode → city / state / areas. Skipped while the registered address is used.
  const shipLookup = usePincodeLookup(shipPincode ?? "")
  useEffect(() => {
    const info = shipLookup.data
    if (!info || sameAsRegistered) return
    setValue("shipCity", info.city, { shouldValidate: true })
    setValue("shipState", info.state, { shouldValidate: true })
    setValue("shipArea", "")
  }, [shipLookup.data, sameAsRegistered, setValue])

  return (
    <Step n={n} title="Shipping address">
      <label
        htmlFor="shipSame"
        className="flex cursor-pointer items-center gap-2.5 text-[0.8125rem] text-foreground/85"
      >
        <Checkbox
          id="shipSame"
          checked={sameAsRegistered}
          onCheckedChange={(v) => onSameAsRegisteredChange(v === true)}
        />
        Same as registered address
      </label>

      {sameAsRegistered ? (
        <div className="rounded-xl border border-border bg-field/60 p-3.5 text-[0.8125rem] leading-relaxed">
          <p className="mb-1 eyebrow text-[0.625rem]">Shipping to the registered address</p>
          {regAddress || regCity || regPincode ? (
            <p className="text-muted-foreground">
              {regAddress}
              {regArea ? `, ${regArea}` : ""}
              {regAddress || regArea ? <br /> : null}
              {[regCity, regState].filter(Boolean).join(", ")}
              {regPincode ? ` – ${regPincode}` : ""}
            </p>
          ) : (
            <p className="text-muted-foreground">
              Fill in the address in step 1 — it will be used here.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Receiver name" htmlFor="shipName" error={errors.shipName?.message}>
              <Input id="shipName" aria-invalid={!!errors.shipName} {...register("shipName")} />
            </Field>
            <Field label="Mobile" htmlFor="shipMobile" error={errors.shipMobile?.message}>
              <Input
                id="shipMobile"
                type="tel"
                inputMode="tel"
                maxLength={10}
                aria-invalid={!!errors.shipMobile}
                {...register("shipMobile", {
                  onChange: (e: ChangeEvent<HTMLInputElement>) => {
                    e.target.value = limitDigits(e.target.value, 10)
                  },
                })}
              />
            </Field>
          </div>
          <Field
            label="House / building, street, area"
            htmlFor="shipLine1"
            error={errors.shipLine1?.message}
          >
            <Textarea
              id="shipLine1"
              autoComplete="shipping street-address"
              className={textareaClass}
              aria-invalid={!!errors.shipLine1}
              {...register("shipLine1")}
            />
          </Field>
          <Field label="Landmark (optional)" htmlFor="shipLandmark">
            <Input id="shipLandmark" {...register("shipLandmark")} />
          </Field>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Field label="Pincode" htmlFor="shipPincode" error={errors.shipPincode?.message}>
              <Input
                id="shipPincode"
                inputMode="numeric"
                maxLength={6}
                autoComplete="shipping postal-code"
                className="font-mono"
                aria-invalid={!!errors.shipPincode}
                {...register("shipPincode")}
              />
              <PincodeHint lookup={shipLookup} complete={isPincode(shipPincode ?? "")} />
            </Field>
            <Field label="Area / post office" htmlFor="shipArea">
              <Controller
                control={control}
                name="shipArea"
                render={({ field }) => (
                  <AreaSelect
                    id="shipArea"
                    areas={shipLookup.data?.areas ?? []}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="City" htmlFor="shipCity" error={errors.shipCity?.message}>
              <Input
                id="shipCity"
                autoComplete="shipping address-level2"
                aria-invalid={!!errors.shipCity}
                {...register("shipCity")}
              />
            </Field>
            <Field label="State" htmlFor="shipState" error={errors.shipState?.message}>
              <Input
                id="shipState"
                autoComplete="shipping address-level1"
                aria-invalid={!!errors.shipState}
                {...register("shipState")}
              />
            </Field>
          </div>
        </>
      )}
      <p className="text-[0.6875rem] text-muted-foreground">
        Prepaid only · processed in 24–48 h · Maharashtra up to 7, rest of India up to 14 business
        days.
      </p>
    </Step>
  )
}

/** One label / value line of the confirm summary. */
export function ConfirmRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

/**
 * Summary, agreement and submit. `placementRows` are the screen's own lines (where the partner
 * goes, who sponsors them); product, BV and the joining order total are filled in here.
 */
export function ConfirmStep<T extends JoiningFormInput>({
  n,
  form,
  product,
  placementRows,
  agreement,
  submitLabel,
  pendingLabel,
  pending,
  disabled,
  footnote,
}: JoiningForm<T> & {
  n: number
  product: PickerProduct | undefined
  placementRows: ReactNode
  /** The agreement sentence next to the checkbox */
  agreement: ReactNode
  submitLabel: string
  pendingLabel: string
  pending: boolean
  disabled?: boolean
  footnote?: ReactNode
}) {
  const {
    control,
    formState: { errors },
  } = fieldsOf(form)
  return (
    <Step n={n} title="Confirm">
      <dl className="space-y-2.5 rounded-xl border border-border bg-field/60 p-3.5 text-[0.8125rem]">
        <ConfirmRow label="Product">
          {product ? (
            <span className="font-medium">{product.shortName}</span>
          ) : (
            <span className="text-muted-foreground">Not chosen</span>
          )}
        </ConfirmRow>
        <ConfirmRow label="New ID">
          <span className="text-muted-foreground">Assigned by system</span>
        </ConfirmRow>
        {placementRows}
        <ConfirmRow label="BV on joining order">
          <span className="font-mono text-gold">{product ? formatBV(product.bv) : "—"}</span>
        </ConfirmRow>
        <div className="flex items-baseline justify-between gap-4 border-t border-border/70 pt-2.5">
          <dt className="font-medium">Joining order</dt>
          <dd className="font-display text-2xl">
            {product ? (
              <PriceTag price={product.price} mrp={product.mrp} mrpClassName="font-sans text-sm" />
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>

      <Controller
        control={control}
        name="agree"
        render={({ field }) => (
          <label
            htmlFor="agree"
            className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground"
          >
            <Checkbox
              id="agree"
              className="mt-0.5"
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
              aria-invalid={!!errors.agree}
            />
            <span>{agreement}</span>
          </label>
        )}
      />
      <FieldError message={errors.agree?.message} />

      <Button type="submit" size="lg" className="w-full" disabled={pending || disabled}>
        {pending ? pendingLabel : submitLabel}
      </Button>
      {footnote ? (
        <p className="text-center text-[0.625rem] leading-relaxed text-muted-foreground">
          {footnote}
        </p>
      ) : null}
    </Step>
  )
}
