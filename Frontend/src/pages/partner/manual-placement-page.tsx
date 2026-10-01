import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { Controller, useForm, useWatch, type DefaultValues } from "react-hook-form"
import { toast } from "sonner"

import { FieldError, FormField as Field } from "@/components/common/form-field"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { ProgressBar } from "@/components/common/progress-bar"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useMySlots, useRegisterDownline } from "@/features/genealogy/queries"
import { AreaSelect, PincodeHint } from "@/features/placement/components/pincode-lookup"
import {
  PlacementSuccess,
  type RegisteredPartner,
} from "@/features/placement/components/placement-success"
import { ProductPicker } from "@/features/placement/components/product-picker"
import {
  GENDERS,
  placementSchema,
  toMobile10,
  type PlacementInput,
  type PlacementValues,
} from "@/features/placement/schemas"
import { isPincode, usePincodeLookup } from "@/features/placement/queries"
import { products } from "@/features/products/mock-data"
import { formatBV, formatINR } from "@/lib/format"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import type { Gender } from "@/types/user"

const TOTAL_SLOTS = 20

/** Form labels → the backend's gender values. */
const GENDER_API: Record<(typeof GENDERS)[number], Gender> = {
  Male: "MALE",
  Female: "FEMALE",
  Other: "OTHER",
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
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

const textareaClass =
  "min-h-20 rounded-xl bg-field px-3.5 py-2.5 focus-visible:border-gold/60 focus-visible:ring-gold/20"

/** Empty form (gender is left unset so the partner has to pick one). */
function blankForm(slot: number, upline: string): DefaultValues<PlacementInput> {
  return {
    fullName: "",
    age: "",
    mobile: "",
    email: "",
    aadhaar: "",
    pan: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    area: "",
    password: "",
    confirmPassword: "",
    upline,
    slot,
    productSku: "",
    shipName: "",
    shipMobile: "",
    shipLine1: "",
    shipLandmark: "",
    shipArea: "",
    shipCity: "",
    shipState: "",
    shipPincode: "",
    agree: false,
  }
}

type Completed = { values: PlacementValues; partner: RegisteredPartner }

export function PartnerManualPlacementPage() {
  // The new partner is always placed under the signed-in user (backend: register-downline).
  const me = useSession((s) => s.user)
  const slotsQuery = useMySlots()
  const registerDownline = useRegisterDownline()

  const takenBySlot = new Map<number, string>(
    (slotsQuery.data?.filledSlots ?? []).map((f) => [f.slotNumber, f.partner.vedId]),
  )
  const freeSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1).filter(
    (n) => !takenBySlot.has(n),
  )
  const firstFreeSlot = freeSlots[0] ?? 1
  const slotsUsed = slotsQuery.data?.totalFilled ?? takenBySlot.size
  const allSlotsFull = !!slotsQuery.data && freeSlots.length === 0

  const [completed, setCompleted] = useState<Completed | null>(null)
  const [shipSameAsRegistered, setShipSameAsRegistered] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = useForm<PlacementInput, unknown, PlacementValues>({
    resolver: zodResolver(placementSchema),
    defaultValues: blankForm(firstFreeSlot, me?.vedId ?? ""),
  })

  const [slot, productSku, regAddress, regCity, regState, regPincode, regArea, shipPincode] =
    useWatch({
      control,
      name: ["slot", "productSku", "address", "city", "state", "pincode", "area", "shipPincode"],
    })

  // Once the real slots arrive, move the selection off a slot that is already taken.
  useEffect(() => {
    if (slotsQuery.data && takenBySlot.has(getValues("slot"))) {
      setValue("slot", firstFreeSlot)
    }
    // takenBySlot / firstFreeSlot are derived from slotsQuery.data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsQuery.data])

  // Pincode → city / state / areas. A found pincode fills City and State (still editable).
  const regLookup = usePincodeLookup(regPincode ?? "")
  const shipLookup = usePincodeLookup(shipPincode ?? "")
  useEffect(() => {
    const info = regLookup.data
    if (!info) return
    setValue("city", info.city, { shouldValidate: true })
    setValue("state", info.state, { shouldValidate: true })
    setValue("area", "")
  }, [regLookup.data, setValue])
  useEffect(() => {
    const info = shipLookup.data
    // With "Same as registered address" the shipping fields are copied, not looked up.
    if (!info || shipSameAsRegistered) return
    setValue("shipCity", info.city, { shouldValidate: true })
    setValue("shipState", info.state, { shouldValidate: true })
    setValue("shipArea", "")
  }, [shipLookup.data, shipSameAsRegistered, setValue])
  const product = products.find((p) => p.sku === productSku)

  /** "Same as registered address" → the registered name, mobile and address become the shipping ones. */
  const copyRegisteredToShipping = () => {
    setValue("shipName", getValues("fullName"))
    setValue("shipMobile", getValues("mobile"))
    setValue("shipLine1", getValues("address"))
    setValue("shipLandmark", "")
    setValue("shipArea", getValues("area"))
    setValue("shipCity", getValues("city"))
    setValue("shipState", getValues("state"))
    setValue("shipPincode", getValues("pincode"))
  }

  const onValid = (values: PlacementValues) => {
    if (takenBySlot.has(values.slot)) {
      setError("slot", { message: `Slot ${values.slot} is already taken` })
      return
    }
    registerDownline.mutate(
      {
        name: values.fullName,
        email: values.email,
        mobile: toMobile10(values.mobile),
        password: values.password,
        slotNumber: values.slot,
        gender: GENDER_API[values.gender],
        addressLine1: values.address,
        addressLine2: values.area || undefined,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      },
      {
        onSuccess: ({ partner }) => {
          setCompleted({ values, partner })
          window.scrollTo({ top: 0, behavior: "smooth" })
        },
      },
    )
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    // Copy right before validating so the shipping address always matches the latest registered one.
    if (shipSameAsRegistered) copyRegisteredToShipping()
    return handleSubmit(onValid, () =>
      toast.error("Some details are missing — check the highlighted fields"),
    )(e)
  }

  const startOver = () => {
    reset(blankForm(firstFreeSlot, me?.vedId ?? ""))
    setShipSameAsRegistered(false)
    setCompleted(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (completed) {
    const done = products.find((p) => p.sku === completed.values.productSku) ?? products[0]
    return (
      <>
        <PageHeader
          title="Manual Placement"
          subtitle="Partner registered and placed in your tree"
        />
        <PageBody>
          <PlacementSuccess
            partner={completed.partner}
            values={completed.values}
            product={done}
            onPlaceAnother={startOver}
          />
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Manual Placement"
        subtitle="Register a new partner, pick their bracelet and slot, and ship the joining order"
      />
      <PageBody>
        <form
          noValidate
          onSubmit={submit}
          className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <div className="min-w-0 space-y-4 md:space-y-5">
            <Step n={1} title="New partner details">
              <div className="grid gap-3 sm:grid-cols-4">
                <Field
                  label="Full name"
                  htmlFor="fullName"
                  error={errors.fullName?.message}
                  className="sm:col-span-2"
                >
                  <Input
                    id="fullName"
                    autoComplete="off"
                    aria-invalid={!!errors.fullName}
                    {...register("fullName")}
                  />
                </Field>
                <Field label="Age" htmlFor="age" error={errors.age?.message}>
                  <Input
                    id="age"
                    inputMode="numeric"
                    maxLength={3}
                    aria-invalid={!!errors.age}
                    {...register("age")}
                  />
                </Field>
                <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="gender"
                          aria-invalid={!!errors.gender}
                          className="h-11 w-full rounded-xl bg-field px-3.5 text-[16px] data-[size=default]:h-11 md:h-10 md:text-sm md:data-[size=default]:h-10"
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {GENDERS.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Mobile" htmlFor="mobile" error={errors.mobile?.message}>
                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="tel"
                    placeholder="+91"
                    aria-invalid={!!errors.mobile}
                    {...register("mobile")}
                  />
                </Field>
                <Field label="Email" htmlFor="email" error={errors.email?.message}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="off"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                </Field>
                <Field label="New ID" htmlFor="newId">
                  <Input
                    id="newId"
                    readOnly
                    tabIndex={-1}
                    value="Assigned by system"
                    className="border-gold/40 bg-gold/10 font-mono text-gold"
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Aadhaar number" htmlFor="aadhaar" error={errors.aadhaar?.message}>
                  <Input
                    id="aadhaar"
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="1234 5678 9012"
                    className="font-mono"
                    aria-invalid={!!errors.aadhaar}
                    {...register("aadhaar")}
                  />
                </Field>
                <Field label="PAN card" htmlFor="pan" error={errors.pan?.message}>
                  <Input
                    id="pan"
                    maxLength={10}
                    autoCapitalize="characters"
                    placeholder="ABCDE1234F"
                    className="font-mono uppercase placeholder:normal-case"
                    aria-invalid={!!errors.pan}
                    {...register("pan")}
                  />
                </Field>
              </div>

              <Field label="Address" htmlFor="address" error={errors.address?.message}>
                <Textarea
                  id="address"
                  autoComplete="street-address"
                  placeholder="House / building, street, area"
                  className={textareaClass}
                  aria-invalid={!!errors.address}
                  {...register("address")}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Field label="Pincode" htmlFor="pincode" error={errors.pincode?.message}>
                  <Input
                    id="pincode"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    className="font-mono"
                    aria-invalid={!!errors.pincode}
                    {...register("pincode")}
                  />
                  <PincodeHint lookup={regLookup} complete={isPincode(regPincode ?? "")} />
                </Field>
                <Field label="Area / post office" htmlFor="area">
                  <Controller
                    control={control}
                    name="area"
                    render={({ field }) => (
                      <AreaSelect
                        id="area"
                        areas={regLookup.data?.areas ?? []}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field>
                <Field label="City" htmlFor="city" error={errors.city?.message}>
                  <Input
                    id="city"
                    autoComplete="address-level2"
                    aria-invalid={!!errors.city}
                    {...register("city")}
                  />
                </Field>
                <Field label="State" htmlFor="state" error={errors.state?.message}>
                  <Input
                    id="state"
                    autoComplete="address-level1"
                    aria-invalid={!!errors.state}
                    {...register("state")}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Password" htmlFor="password" error={errors.password?.message}>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                </Field>
                <Field
                  label="Confirm password"
                  htmlFor="confirmPassword"
                  error={errors.confirmPassword?.message}
                >
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    {...register("confirmPassword")}
                  />
                </Field>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground">
                The VEDORA ID is created by the system when you register · the partner signs in with
                that ID and this password.
              </p>
            </Step>

            <Step n={2} title="Upline & slot">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Upline VEDORA ID" htmlFor="upline">
                  <div className="relative">
                    <Input
                      id="upline"
                      readOnly
                      tabIndex={-1}
                      className="border-gold/50 pr-20 font-mono uppercase"
                      {...register("upline")}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-success">
                      You ✓
                    </span>
                  </div>
                </Field>
                <div className="self-end rounded-xl border border-border bg-field/60 px-3.5 py-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-foreground/85">{me?.name}</span>
                    <span className="font-medium text-success">
                      {TOTAL_SLOTS - slotsUsed} of {TOTAL_SLOTS} free
                    </span>
                  </div>
                  <ProgressBar value={slotsUsed} max={TOTAL_SLOTS} label="BV-eligible slots used" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="eyebrow">Choose slot</p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-[3px] bg-field ring-1 ring-border" /> Taken
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-[3px] border border-dashed border-gold/60" />{" "}
                      Free
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-[3px] bg-gold" /> Selected
                    </span>
                  </p>
                </div>
                <QueryState query={slotsQuery} rows={2}>
                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                    {Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1).map((n) => {
                      const takenBy = takenBySlot.get(n)
                      const selected = n === slot && !takenBy
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={!!takenBy}
                          aria-pressed={selected}
                          aria-label={
                            takenBy
                              ? `Slot ${n}, taken by ${takenBy}`
                              : selected
                                ? `Slot ${n}, selected for the new partner`
                                : `Slot ${n}, free`
                          }
                          title={takenBy ? `Slot ${n} · ${takenBy}` : `Slot ${n} · free`}
                          onClick={() => setValue("slot", n, { shouldValidate: true })}
                          className={cn(
                            "flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 text-xs font-medium tabular-nums transition-colors",
                            takenBy && "border-border bg-field/70 text-muted-foreground/70",
                            !takenBy &&
                              !selected &&
                              "border-dashed border-gold/40 text-gold hover:bg-gold/10",
                            selected &&
                              "border-gold bg-gold text-primary-foreground ring-3 ring-gold/25",
                          )}
                        >
                          {String(n).padStart(2, "0")}
                          {takenBy || selected ? (
                            <span
                              className={cn(
                                "max-w-full truncate font-mono text-[0.5625rem] leading-none",
                                takenBy ? "opacity-70" : "font-bold",
                              )}
                            >
                              {takenBy ?? "New"}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </QueryState>
                <FieldError message={errors.slot?.message} />
                <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                  {allSlotsFull
                    ? "All 20 slots under you are taken — the backend allows 20 direct partners."
                    : "Grey slots show who is in them · pick a free slot for the new partner · slots 1–20 are BV-eligible."}
                </p>
              </div>
            </Step>

            <Step n={3} title="Choose the joining product">
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
              />
              <FieldError message={errors.productSku?.message} />
              <p className="text-[0.6875rem] text-muted-foreground">
                One bracelet per joining · {formatINR(1999)} MRP incl. GST · 1,000 BV.
              </p>
            </Step>

            <Step n={4} title="Shipping address">
              <label
                htmlFor="shipSame"
                className="flex cursor-pointer items-center gap-2.5 text-[0.8125rem] text-foreground/85"
              >
                <Checkbox
                  id="shipSame"
                  checked={shipSameAsRegistered}
                  onCheckedChange={(v) => setShipSameAsRegistered(v === true)}
                />
                Same as registered address
              </label>

              {shipSameAsRegistered ? (
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
                    <Field
                      label="Receiver name"
                      htmlFor="shipName"
                      error={errors.shipName?.message}
                    >
                      <Input
                        id="shipName"
                        aria-invalid={!!errors.shipName}
                        {...register("shipName")}
                      />
                    </Field>
                    <Field label="Mobile" htmlFor="shipMobile" error={errors.shipMobile?.message}>
                      <Input
                        id="shipMobile"
                        type="tel"
                        inputMode="tel"
                        aria-invalid={!!errors.shipMobile}
                        {...register("shipMobile")}
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
                    <Field
                      label="Pincode"
                      htmlFor="shipPincode"
                      error={errors.shipPincode?.message}
                    >
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
                Prepaid only · processed in 24–48 h · Maharashtra up to 7, rest of India up to 14
                business days.
              </p>
            </Step>
          </div>

          <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <Step n={5} title="Confirm">
              <dl className="space-y-2.5 rounded-xl border border-border bg-field/60 p-3.5 text-[0.8125rem]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Product</dt>
                  <dd className="text-right font-medium">
                    {product ? (
                      product.shortName
                    ) : (
                      <span className="text-muted-foreground">Not chosen</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">New ID</dt>
                  <dd className="text-muted-foreground">Assigned by system</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Placement</dt>
                  <dd className="text-right">
                    Slot {slot} under <MonoId tone="gold">{me?.vedId}</MonoId>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">BV on joining order</dt>
                  <dd className="font-mono text-gold">{formatBV(product?.bv ?? 1000)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border/70 pt-2.5">
                  <dt className="font-medium">Joining order</dt>
                  <dd className="font-display text-2xl">{formatINR(product?.price ?? 1999)}</dd>
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
                    <span>
                      The details are correct, and the new partner accepts the VEDORA Partner
                      Agreement, Terms &amp; Conditions and Privacy Policy.
                    </span>
                  </label>
                )}
              />
              <FieldError message={errors.agree?.message} />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={registerDownline.isPending || allSlotsFull || !slotsQuery.data}
              >
                {registerDownline.isPending ? "Registering…" : "Register partner"}
              </Button>
              <p className="text-center text-[0.625rem] leading-relaxed text-muted-foreground">
                Registers the partner in the backend. The joining order and its payment are not in
                the backend yet — the partner can order from Products after signing in.
              </p>
            </Step>
          </div>
        </form>
      </PageBody>
    </>
  )
}
