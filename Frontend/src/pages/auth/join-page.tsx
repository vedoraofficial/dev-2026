import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { CircleAlert, CircleCheck } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useForm, useWatch, type DefaultValues } from "react-hook-form"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import logo from "@/assets/images/vedora-logo-mark.jpg"
import { MonoId } from "@/components/common/mono-id"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { openRazorpayCheckout, type PaymentStatusResponse } from "@/features/payments/api"
import {
  getJoinStatus,
  joinWithOrder,
  sendJoinOtp,
  verifyJoinOtp,
  verifyJoinPayment,
} from "@/features/placement/api"
import { JoiningPayment } from "@/features/placement/components/joining-payment"
import { MobileOtpVerify } from "@/features/placement/components/mobile-otp-verify"
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
  toMobile10,
  type ReferralJoinInput,
  type ReferralJoinValues,
} from "@/features/placement/schemas"
import { toCatalogProduct } from "@/features/products/catalog"
import { usePublicProducts } from "@/features/products/queries"
import { formatINR } from "@/lib/format"
import { useApiMutation } from "@/lib/mutation"
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

/** The Razorpay order of a join payment in progress — survives a refresh while it's confirmed. */
const PENDING_KEY = "vedora.joinPayment"

type PendingJoin = { razorpayOrderId: string; sponsorId: string }

function readPendingJoin(sponsorId: string): string | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null") as PendingJoin | null
    return saved?.sponsorId === sponsorId ? saved.razorpayOrderId : null
  } catch {
    return null
  }
}

function savePendingJoin(pending: PendingJoin | null) {
  try {
    if (pending) sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    else sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // Private mode / blocked storage — the page still works, it just can't resume after a refresh.
  }
}

type Welcome = {
  name: string
  vedId: string
  slotNumber?: number
  sponsorName?: string
  sponsorVedId: string
}

/**
 * Public page behind a referral link (/join/VED000021) — the Add Partner form without the
 * "Upline & slot" step. The new partner verifies their mobile with OTP and pays the joining order
 * online; their VEDORA ID is created (in the sponsor's lowest free slot) only once the payment
 * succeeds. Products come from the public product list, with live stock.
 */
export function JoinPage() {
  const { ref = "" } = useParams()
  const sponsorId = normalizeVedId(ref)
  // Admin (VED108) can't sponsor anyone; partner IDs are VED + digits.
  const validLink = /^VED\d{3,6}$/.test(sponsorId) && sponsorId !== "VED108"
  const [joined, setJoined] = useState<Welcome | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [shipSameAsRegistered, setShipSameAsRegistered] = useState(false)
  // The mobile number, once verified with OTP — needed before paying
  const [verifiedMobile, setVerifiedMobile] = useState<string | null>(null)
  // A paid join still being confirmed (also picked up again after a refresh)
  const [checkingOrder, setCheckingOrder] = useState<string | null>(() =>
    readPendingJoin(sponsorId),
  )

  const form = useForm<ReferralJoinInput, unknown, ReferralJoinValues>({
    resolver: zodResolver(referralJoinSchema),
    defaultValues: blank,
  })
  // Products on sale come from the public API, so stock (and out of stock) is live here too.
  const productsQuery = usePublicProducts()
  const products = (productsQuery.data ?? []).map((p) => toCatalogProduct(p))
  const [productSku, mobile] = useWatch({ control: form.control, name: ["productSku", "mobile"] })
  const product = products.find((p) => p.sku === productSku)

  const join = useApiMutation(joinWithOrder, { success: "Opening payment…" })

  /** What the backend says about the payment: registered, still confirming, or not registered. */
  const showResult = (res: PaymentStatusResponse, razorpayOrderId: string) => {
    if (res.status === "COMPLETED" && res.partner) {
      savePendingJoin(null)
      setCheckingOrder(null)
      setJoined({
        name: res.partner.name,
        vedId: res.partner.vedId,
        slotNumber: res.partner.slotNumber,
        sponsorName: res.sponsor?.name,
        sponsorVedId: res.sponsor?.vedId ?? sponsorId,
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else if (res.status === "FAILED" || res.status === "REFUNDED") {
      savePendingJoin(null)
      setCheckingOrder(null)
      setFailed(res.message)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      setCheckingOrder(razorpayOrderId)
    }
  }

  // Paid but not confirmed yet (or the page was refreshed) — ask the backend every few seconds.
  const status = useQuery({
    queryKey: ["public-join", "status", checkingOrder],
    queryFn: () => getJoinStatus(checkingOrder ?? ""),
    enabled: !!checkingOrder,
    refetchInterval: (q) => (q.state.data?.status === "PENDING" ? 3000 : false),
  })
  useEffect(() => {
    if (status.data && checkingOrder) showResult(status.data, checkingOrder)
    // showResult only sets state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.data])
  useEffect(() => {
    // The saved payment isn't known to the backend any more — start over.
    if (status.isError) {
      savePendingJoin(null)
      setCheckingOrder(null)
    }
  }, [status.isError])

  const onValid = (values: ReferralJoinValues) => {
    if (toMobile10(values.mobile) !== verifiedMobile) {
      form.setError("mobile", { message: "Verify this mobile number with OTP" })
      toast.error("Verify your mobile number with OTP first")
      return
    }
    const chosen = products.find((p) => p.sku === values.productSku)
    if (!chosen?.id) {
      form.setError("productSku", { message: "Choose a product" })
      return
    }
    // Nothing is created until the payment goes through.
    join.mutate(
      {
        ...partnerDetailsPayload(values),
        referralId: sponsorId,
        productId: chosen.id,
        quantity: 1,
      },
      {
        onSuccess: (result) => {
          const razorpayOrderId = result.razorpayOrderId
          savePendingJoin({ razorpayOrderId, sponsorId })
          // The join page checks the payment with its own public API, which answers with the status.
          let verified: PaymentStatusResponse | null = null
          openRazorpayCheckout({
            initiateData: result.checkout,
            verify: async (payload) => {
              verified = await verifyJoinPayment(payload)
              return { message: verified.message }
            },
            onSuccess: () => {
              if (verified) showResult(verified, razorpayOrderId)
            },
            onDismiss: () => {
              savePendingJoin(null)
              toast.info("Payment cancelled — you were not registered.")
            },
            onError: () => {
              // The payment may still have gone through — check with the backend.
              setCheckingOrder(razorpayOrderId)
            },
          }).catch(() => {
            // onError above already handled it
          })
        },
      },
    )
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    // Copy right before validating so the shipping address matches the latest registered one.
    if (shipSameAsRegistered) copyRegisteredToShipping(form)
    return form.handleSubmit(onValid, () => {
      // Flag an unverified mobile together with the other missing fields
      if (toMobile10(form.getValues("mobile")) !== verifiedMobile) {
        form.setError("mobile", { message: "Verify this mobile number with OTP" })
      }
      toast.error("Some details are missing — check the highlighted fields")
    })(e)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <img
          src={logo}
          alt="VEDORA — Wear Your Energy"
          width={640}
          height={398}
          className="h-20 w-auto rounded-xl border border-gold/20 shadow-[0_12px_30px_-12px_var(--shadow-color)] md:h-24"
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
            Payment received. You&apos;re placed under{" "}
            {joined.sponsorName
              ? `${joined.sponsorName} (${joined.sponsorVedId})`
              : joined.sponsorVedId}
            {joined.slotNumber ? ` in slot ${joined.slotNumber}` : ""}, and your joining order ships
            to your address. Sign in with your new ID and the password you just set.
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
      ) : checkingOrder ? (
        <Panel className="flex flex-col items-center gap-3 py-10 text-center" aria-busy="true">
          <span
            className="size-10 animate-spin rounded-full border-3 border-gold/30 border-t-gold"
            aria-hidden
          />
          <h1 className="font-display text-3xl">Confirming your payment…</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            This takes a few seconds. Please don&apos;t close this page — your VEDORA ID appears
            here as soon as the payment is confirmed.
          </p>
        </Panel>
      ) : failed ? (
        <Panel className="flex flex-col items-center gap-4 py-10 text-center">
          <CircleAlert className="size-12 text-danger" aria-hidden />
          <h1 className="font-display text-3xl">You weren&apos;t registered</h1>
          <p className="max-w-md text-sm text-muted-foreground">{failed}</p>
          <Button size="lg" onClick={() => setFailed(null)}>
            Back to the form
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
                <PartnerDetailsFields
                  form={form}
                  mobileVerification={
                    <MobileOtpVerify
                      mobile={mobile}
                      verifiedMobile={verifiedMobile}
                      onVerified={(m) => {
                        setVerifiedMobile(m)
                        form.clearErrors("mobile")
                      }}
                      sendOtp={(m) => sendJoinOtp(sponsorId, m)}
                      verifyOtp={(input) => verifyJoinOtp(sponsorId, input)}
                    />
                  }
                />
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
                payment={
                  <JoiningPayment
                    value="RAZORPAY"
                    onChange={() => {}}
                    walletBalance={undefined}
                    price={product?.price}
                    walletUnavailable="Available after you join — you don't have a wallet yet"
                  />
                }
                agreement="My details are correct, and I accept the VEDORA Partner Agreement, Terms & Conditions and Privacy Policy."
                submitLabel={
                  product ? `Pay ${formatINR(product.price)} & join` : "Pay online & join"
                }
                pendingLabel="Opening payment…"
                pending={join.isPending}
                footnote="Your VEDORA ID is created only after the payment succeeds. Your joining order ships to your registered address in 24–48 business hours."
              />
            </div>
          </form>
        </>
      )}
    </div>
  )
}
