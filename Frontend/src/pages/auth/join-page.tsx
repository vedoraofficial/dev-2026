import { zodResolver } from "@hookform/resolvers/zod"
import { CircleCheck } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useForm, useWatch, type DefaultValues } from "react-hook-form"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import logo from "@/assets/images/vedora-logo.jpg"
import { MonoId } from "@/components/common/mono-id"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { useJoinPartner } from "@/features/genealogy/queries"
import type { JoinedPartner } from "@/features/genealogy/types"
import { PartnerDetailsFields } from "@/features/placement/components/partner-details-fields"
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
  referralJoinSchema,
  type ReferralJoinInput,
  type ReferralJoinValues,
} from "@/features/placement/schemas"
import { toCatalogProduct } from "@/features/products/catalog"
import { usePublicProducts } from "@/features/products/queries"
import { normalizeVedId } from "@/lib/ved-id"

const blank: DefaultValues<ReferralJoinInput> = {
  fullName: "",
  age: "",
  mobile: "",
  email: "",
  aadhaar: "",
  pan: "",
  address: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  password: "",
  confirmPassword: "",
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

/**
 * Public page behind a referral link (/join/VED000021) — the Add Partner form without the
 * "Upline & slot" step. The sponsor is the ID in the link; POST /api/partner/join places the new
 * partner in that sponsor's lowest free slot. Products come from the public product list, with
 * live stock.
 */
export function JoinPage() {
  const { ref = "" } = useParams()
  const sponsorId = normalizeVedId(ref)
  // Admin (VED108) can't sponsor anyone; partner IDs are VED + digits.
  const validLink = /^VED\d{3,6}$/.test(sponsorId) && sponsorId !== "VED108"
  const join = useJoinPartner()
  const [joined, setJoined] = useState<JoinedPartner["partner"] | null>(null)
  const [shipSameAsRegistered, setShipSameAsRegistered] = useState(false)

  const form = useForm<ReferralJoinInput, unknown, ReferralJoinValues>({
    resolver: zodResolver(referralJoinSchema),
    defaultValues: blank,
  })
  // Products on sale come from the public API, so stock (and out of stock) is live here too.
  const productsQuery = usePublicProducts()
  const products = (productsQuery.data ?? []).map((p) => toCatalogProduct(p))
  const productSku = useWatch({ control: form.control, name: "productSku" })
  const product = products.find((p) => p.sku === productSku)

  const onValid = (values: ReferralJoinValues) =>
    join.mutate(
      { ...partnerDetailsPayload(values), referralId: sponsorId },
      {
        onSuccess: (r) => {
          setJoined(r.partner)
          window.scrollTo({ top: 0, behavior: "smooth" })
        },
      },
    )

  const submit = (e: FormEvent<HTMLFormElement>) => {
    // Copy right before validating so the shipping address matches the latest registered one.
    if (shipSameAsRegistered) copyRegisteredToShipping(form)
    return form.handleSubmit(onValid, () =>
      toast.error("Some details are missing — check the highlighted fields"),
    )(e)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <img
          src={logo}
          alt="VEDORA — Wear Your Energy"
          width={1400}
          height={834}
          className="h-20 w-auto rounded-xl border border-gold/20 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.7)] md:h-24"
        />
        <Button asChild variant="outline">
          <Link to={ROUTES.login}>Sign in</Link>
        </Button>
      </div>

      {!validLink ? (
        <Panel className="py-10 text-center">
          <h1 className="font-display text-3xl">This referral link isn&apos;t valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask your sponsor to share their link again, or sign in if you already have a VEDORA ID.
          </p>
        </Panel>
      ) : joined ? (
        <Panel className="flex flex-col items-center gap-4 py-10 text-center">
          <CircleCheck className="size-12 text-success" aria-hidden />
          <h1 className="font-display text-3xl">Welcome to VEDORA, {joined.name}</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            You&apos;re placed under {joined.sponsorName} ({joined.sponsorVedId}) in slot{" "}
            {joined.slotNumber}. Sign in with your new ID and the password you just set.
          </p>
          <div className="rounded-xl border border-gold/40 bg-gold/10 px-6 py-4">
            <p className="eyebrow text-[0.625rem]">Your VEDORA ID</p>
            <MonoId tone="gold" className="text-2xl">
              {joined.vedId}
            </MonoId>
          </div>
          <Button asChild size="lg">
            <Link to={ROUTES.login}>Sign in now</Link>
          </Button>
        </Panel>
      ) : (
        <>
          <div>
            <h1 className="font-display text-[2rem] leading-tight md:text-4xl">Join VEDORA</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re joining the team of <MonoId tone="gold">{sponsorId}</MonoId> — you&apos;ll
              be placed in their next free slot.
            </p>
          </div>
          <form
            noValidate
            onSubmit={submit}
            className="grid gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"
          >
            <div className="min-w-0 space-y-4 md:space-y-5">
              <Step n={1} title="Your details">
                <PartnerDetailsFields form={form} />
              </Step>
              <JoiningProductStep
                n={2}
                form={form}
                products={products}
                wrap={(picker) => (
                  <QueryState
                    query={productsQuery}
                    rows={1}
                    empty={products.length === 0}
                    emptyMessage="No products are on sale right now."
                  >
                    {picker}
                  </QueryState>
                )}
              />
              <ShippingStep
                n={3}
                form={form}
                sameAsRegistered={shipSameAsRegistered}
                onSameAsRegisteredChange={setShipSameAsRegistered}
              />
            </div>

            <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
              <ConfirmStep
                n={4}
                form={form}
                product={product}
                placementRows={
                  <ConfirmRow label="Sponsor">
                    <MonoId tone="gold">{sponsorId}</MonoId>
                  </ConfirmRow>
                }
                agreement="My details are correct, and I accept the VEDORA Partner Agreement, Terms & Conditions and Privacy Policy."
                submitLabel="Join VEDORA"
                pendingLabel="Joining…"
                pending={join.isPending}
                footnote="Creates your VEDORA ID. The joining order and its payment aren't online yet — you can order from Products after signing in."
              />
            </div>
          </form>
        </>
      )}
    </div>
  )
}
