import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState, type FormEvent } from "react"
import { useForm, useWatch, type DefaultValues } from "react-hook-form"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { FieldError, FormField as Field } from "@/components/common/form-field"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { ProgressBar } from "@/components/common/progress-bar"
import { QueryState } from "@/components/common/query-state"
import { Input } from "@/components/ui/input"
import { useGenealogyOf, useMySlots, useRegisterDownline } from "@/features/genealogy/queries"
import { PartnerDetailsFields } from "@/features/placement/components/partner-details-fields"
import {
  PlacementSuccess,
  type RegisteredPartner,
} from "@/features/placement/components/placement-success"
import {
  ConfirmRow,
  ConfirmStep,
  JoiningProductStep,
  ShippingStep,
  Step,
} from "@/features/placement/components/placement-steps"
import {
  copyRegisteredToShipping,
  partnerDetailsPayload,
} from "@/features/placement/partner-details"
import {
  placementSchema,
  type PlacementInput,
  type PlacementValues,
} from "@/features/placement/schemas"
import { toCatalogProduct } from "@/features/products/catalog"
import type { Product } from "@/features/products/mock-data"
import { useProducts } from "@/features/products/queries"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import { normalizeVedId } from "@/lib/ved-id"

const TOTAL_SLOTS = 20

/** Lowest free slot (1–20) given the taken ones; 1 when everything is taken. */
function firstFree(taken: Map<number, string>): number {
  for (let n = 1; n <= TOTAL_SLOTS; n++) if (!taken.has(n)) return n
  return 1
}

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

type Completed = { values: PlacementValues; partner: RegisteredPartner; product: Product }

export function PartnerManualPlacementPage() {
  // The signed-in user is always the sponsor (earns the ₹200 direct commission). The partner is
  // placed under them, or under a team member whose VEDORA ID is typed in "Place under".
  const me = useSession((s) => s.user)
  const slotsQuery = useMySlots()
  // The joining product is picked from what Admin has put live in Products.
  const productsQuery = useProducts()
  const products = (productsQuery.data ?? [])
    .filter((p) => p.status === "ACTIVE")
    .map((p) => toCatalogProduct(p))
  const registerDownline = useRegisterDownline()

  const myTaken = new Map<number, string>(
    (slotsQuery.data?.filledSlots ?? []).map((f) => [f.slotNumber, f.partner.vedId]),
  )
  const myFirstFreeSlot = firstFree(myTaken)

  const [completed, setCompleted] = useState<Completed | null>(null)
  const [shipSameAsRegistered, setShipSameAsRegistered] = useState(false)

  const form = useForm<PlacementInput, unknown, PlacementValues>({
    resolver: zodResolver(placementSchema),
    defaultValues: blankForm(myFirstFreeSlot, me?.vedId ?? ""),
  })
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = form

  const [slot, productSku, uplineRaw] = useWatch({
    control,
    name: ["slot", "productSku", "upline"],
  })

  // "Place under": me by default, or a team member (their team comes from the genealogy API,
  // which the backend allows only for IDs inside my own downline).
  const upline = normalizeVedId(uplineRaw ?? "")
  const underMe = upline === "" || upline === me?.vedId
  const uplineLooksValid = /^VED\d{3,6}$/.test(upline)
  const teamQuery = useGenealogyOf(!underMe && uplineLooksValid ? upline : "")
  const placementData = underMe ? slotsQuery.data : teamQuery.data
  const takenBySlot = underMe
    ? myTaken
    : new Map<number, string>((teamQuery.data ?? []).map((p) => [p.slotNumber, p.vedId]))
  const freeCount = TOTAL_SLOTS - takenBySlot.size
  const firstFreeSlot = firstFree(takenBySlot)
  const allSlotsFull = !!placementData && freeCount <= 0
  const uplineName = underMe
    ? me?.name
    : slotsQuery.data?.filledSlots.find((f) => f.partner.vedId === upline)?.partner.name
  const uplineStatus = (teamQuery.error as { response?: { status?: number } } | null)?.response
    ?.status
  const uplineProblem = underMe
    ? null
    : !uplineLooksValid
      ? "IDs look like VED000023"
      : uplineStatus === 403
        ? "This ID isn't in your team"
        : uplineStatus === 404
          ? "No partner has this VEDORA ID"
          : teamQuery.isError
            ? "Couldn't load this member's slots"
            : null

  // When the slots of a newly chosen upline arrive, select their first free slot; on a refresh
  // of the same upline, only move the selection if it became taken.
  const [slotsFor, setSlotsFor] = useState("")
  useEffect(() => {
    if (!placementData) return
    if (slotsFor !== upline || takenBySlot.has(getValues("slot"))) {
      setValue("slot", firstFreeSlot)
      setSlotsFor(upline)
    }
    // takenBySlot / firstFreeSlot are derived from placementData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementData, upline])

  const product = products.find((p) => p.sku === productSku)

  const onValid = (values: PlacementValues) => {
    const chosen = products.find((p) => p.sku === values.productSku)
    if (!chosen) {
      setError("productSku", { message: "Choose a product" })
      return
    }
    if (uplineProblem) {
      setError("upline", { message: uplineProblem })
      return
    }
    if (takenBySlot.has(values.slot)) {
      setError("slot", { message: `Slot ${values.slot} is already taken` })
      return
    }
    registerDownline.mutate(
      {
        ...partnerDetailsPayload(values),
        slotNumber: values.slot,
        parentVedId: underMe ? undefined : upline,
      },
      {
        onSuccess: ({ partner }) => {
          setCompleted({ values, partner, product: chosen })
          window.scrollTo({ top: 0, behavior: "smooth" })
        },
      },
    )
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    // Copy right before validating so the shipping address always matches the latest registered one.
    if (shipSameAsRegistered) copyRegisteredToShipping(form)
    return handleSubmit(onValid, () =>
      toast.error("Some details are missing — check the highlighted fields"),
    )(e)
  }

  const startOver = () => {
    reset(blankForm(myFirstFreeSlot, me?.vedId ?? ""))
    setShipSameAsRegistered(false)
    setCompleted(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (completed) {
    return (
      <>
        <PageHeader title="Add Partner" subtitle="Partner registered and placed in your tree" />
        <PageBody>
          <PlacementSuccess
            partner={completed.partner}
            values={completed.values}
            product={completed.product}
            onPlaceAnother={startOver}
          />
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Add Partner"
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
              <PartnerDetailsFields form={form} />
            </Step>

            <Step n={2} title="Upline & slot">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Place under (upline VEDORA ID)"
                  htmlFor="upline"
                  error={errors.upline?.message ?? uplineProblem ?? undefined}
                >
                  <div className="relative">
                    <Input
                      id="upline"
                      maxLength={9}
                      autoCapitalize="characters"
                      spellCheck={false}
                      aria-invalid={!!uplineProblem || !!errors.upline}
                      className="border-gold/50 pr-24 font-mono uppercase"
                      {...register("upline")}
                    />
                    <span className="absolute inset-y-0 right-3.5 flex items-center text-xs font-medium">
                      {underMe ? (
                        <span className="text-success">You ✓</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setValue("upline", me?.vedId ?? "")}
                          className="text-gold hover:underline"
                        >
                          Use my ID
                        </button>
                      )}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-muted-foreground">
                    Your ID by default. Type a team member&apos;s ID to place the partner under them
                    — you still get the ₹200 direct commission; BV income follows the tree.
                  </p>
                </Field>
                <div className="self-start rounded-xl border border-border bg-field/60 px-3.5 py-2.5 sm:mt-7">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate text-foreground/85">
                      {underMe ? me?.name : (uplineName ?? upline)}
                      {underMe ? null : (
                        <span className="ml-1 text-muted-foreground">· team member</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-medium",
                        allSlotsFull ? "text-danger" : "text-success",
                      )}
                    >
                      {placementData ? `${freeCount} of ${TOTAL_SLOTS} free` : "—"}
                    </span>
                  </div>
                  <ProgressBar
                    value={placementData ? TOTAL_SLOTS - freeCount : 0}
                    max={TOTAL_SLOTS}
                    label="BV-eligible slots used"
                  />
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
                {!underMe && uplineProblem ? (
                  <p className="rounded-xl border border-dashed border-border px-3.5 py-6 text-center text-xs text-muted-foreground">
                    Enter the VEDORA ID of someone in your team to see their slots.
                  </p>
                ) : (
                  <QueryState query={underMe ? slotsQuery : teamQuery} rows={2}>
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
                )}
                <FieldError message={errors.slot?.message} />
                <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                  {allSlotsFull
                    ? underMe
                      ? "All 20 of your slots are taken — type a team member's VEDORA ID above to place the partner under them."
                      : `All 20 slots under ${upline} are taken — try another team member.`
                    : "Grey slots show who is in them · pick a free slot for the new partner · slots 1–20 are BV-eligible."}
                </p>
              </div>
            </Step>

            <JoiningProductStep
              n={3}
              form={form}
              products={products}
              wrap={(picker) => (
                <QueryState
                  query={productsQuery}
                  rows={1}
                  empty={products.length === 0}
                  emptyMessage="No products are live yet. Admin can add them in Products."
                >
                  {picker}
                </QueryState>
              )}
            />

            <ShippingStep
              n={4}
              form={form}
              sameAsRegistered={shipSameAsRegistered}
              onSameAsRegisteredChange={setShipSameAsRegistered}
            />
          </div>

          <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <ConfirmStep
              n={5}
              form={form}
              product={product}
              placementRows={
                <>
                  <ConfirmRow label="Placement">
                    Slot {slot} under <MonoId tone="gold">{underMe ? me?.vedId : upline}</MonoId>
                  </ConfirmRow>
                  {underMe ? null : (
                    <ConfirmRow label="Sponsor · ₹200 direct">
                      You · <MonoId tone="gold">{me?.vedId}</MonoId>
                    </ConfirmRow>
                  )}
                </>
              }
              agreement={
                <>
                  The details are correct, and the new partner accepts the VEDORA Partner Agreement,
                  Terms &amp; Conditions and{" "}
                  <Link
                    to={ROUTES.partner.policies}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-gold hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </>
              }
              submitLabel="Register partner"
              pendingLabel="Registering…"
              pending={registerDownline.isPending}
              disabled={allSlotsFull || !placementData || !!uplineProblem}
              footnote="Registers the partner in the backend. The joining order and its payment are not in the backend yet — the partner can order from Products after signing in."
            />
          </div>
        </form>
      </PageBody>
    </>
  )
}
