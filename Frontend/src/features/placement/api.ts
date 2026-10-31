import type { RegisteredPartner } from "@/features/placement/components/placement-success"
import type { partnerDetailsPayload } from "@/features/placement/partner-details"
import { api } from "@/lib/api"
import type {
  InitiatePaymentResponse,
  PaymentStatusResponse,
  VerifyPaymentPayload,
} from "@/features/payments/api"

/** What the address form needs from a pincode. */
export type PincodeInfo = {
  pincode: string
  /** Taluka / block (e.g. "Malegaon"), or the district when India Post has no block */
  city: string
  district: string
  state: string
  /** Post offices / localities under this pincode (e.g. "Khayde", "Chandanpuri") */
  areas: string[]
}

/** The slice of India Post's response we read. */
type IndiaPostResponse = {
  Status: "Success" | "Error" | "404"
  PostOffice: { Name: string; Block: string; District: string; State: string }[] | null
}[]

/**
 * TEMPORARY: calls the free India Post API directly. Once the backend has
 * `GET /api/public/pincode/{pincode}`, change this to `api.get(`/public/pincode/${pincode}`)` —
 * nothing else needs to change. Returns null for a pincode that doesn't exist.
 */
export async function lookupPincode(pincode: string): Promise<PincodeInfo | null> {
  const { data } = await api.get<IndiaPostResponse>(
    `https://api.postalpincode.in/pincode/${pincode}`,
  )
  const offices = data[0]?.Status === "Success" ? data[0].PostOffice : null
  if (!offices?.length) return null

  const first = offices[0]
  const block = first.Block && first.Block !== "NA" ? first.Block : first.District
  return {
    pincode,
    city: block,
    district: first.District,
    state: first.State,
    areas: [...new Set(offices.map((o) => o.Name))].sort(),
  }
}

/** POST /api/partner/mobile-otp/send — SMS an OTP to the new partner's mobile (Add Partner). */
export async function sendMobileOtp(
  mobile: string,
): Promise<{ message: string; expiresInSeconds: number }> {
  const { data } = await api.post<{ message: string; expiresInSeconds: number }>(
    "/partner/mobile-otp/send",
    { mobile },
  )
  return data
}

/** POST /api/partner/mobile-otp/verify — a verified number can be registered for 30 minutes. */
export async function verifyMobileOtp(input: {
  mobile: string
  otp: string
}): Promise<{ verified: true; mobile: string; message: string }> {
  const { data } = await api.post<{ verified: true; mobile: string; message: string }>(
    "/partner/mobile-otp/verify",
    input,
  )
  return data
}

// ─── Referral join page (no sign-in): the same flow as Add Partner, paid by the new partner ───

/** POST /api/public/join/otp/send */
export async function sendJoinOtp(
  referralId: string,
  mobile: string,
): Promise<{ message: string; expiresInSeconds: number }> {
  const { data } = await api.post<{ message: string; expiresInSeconds: number }>(
    "/public/join/otp/send",
    { referralId, mobile },
  )
  return data
}

/** POST /api/public/join/otp/verify */
export async function verifyJoinOtp(
  referralId: string,
  input: { mobile: string; otp: string },
): Promise<{ verified: true; mobile: string; message: string }> {
  const { data } = await api.post<{ verified: true; mobile: string; message: string }>(
    "/public/join/otp/verify",
    { referralId, ...input },
  )
  return data
}

export type JoinWithOrderInput = ReturnType<typeof partnerDetailsPayload> & {
  /** VEDORA ID from the referral link */
  referralId: string
  productId: number
  quantity?: number
}

/** POST /api/public/join — nothing is created until the Razorpay payment succeeds. */
export async function joinWithOrder(input: JoinWithOrderInput): Promise<{
  status: "PAYMENT_REQUIRED"
  message: string
  razorpayOrderId: string
  checkout: InitiatePaymentResponse
  amount: number
  partnerName: string
}> {
  const { data } = await api.post("/public/join", input)
  return data
}

/** POST /api/public/join/verify — after the Razorpay popup; creates the VEDORA ID. */
export async function verifyJoinPayment(
  payload: VerifyPaymentPayload,
): Promise<PaymentStatusResponse> {
  const { data } = await api.post<PaymentStatusResponse>("/public/join/verify", payload)
  return data
}

/** GET /api/public/join/status/:razorpayOrderId */
export async function getJoinStatus(razorpayOrderId: string): Promise<PaymentStatusResponse> {
  const { data } = await api.get<PaymentStatusResponse>(
    `/public/join/status/${encodeURIComponent(razorpayOrderId)}`,
  )
  return data
}

/** POST /api/partner/register-with-order — a new partner plus their joining order. */
export type RegisterWithOrderInput = ReturnType<typeof partnerDetailsPayload> & {
  /** 1–20; leave out for the lowest free slot */
  slotNumber?: number
  /** Place under this team member instead of yourself (you stay the sponsor) */
  parentVedId?: string
  productId: number
  quantity?: number
  /**
   * WALLET pays from the sponsor's wallet now; RAZORPAY returns Razorpay checkout details;
   * PAY_LATER creates the partner now (ID inactive) — they pay the joining order from My Orders
   */
  paymentMethod: "WALLET" | "RAZORPAY" | "PAY_LATER"
}

export type RegisterWithOrderResult =
  | {
      /**
       * COMPLETED: paid from the wallet — the partner (active) and their PAID joining order exist.
       * PENDING_PAYMENT: pay later — the partner exists with an inactive ID; the joining order waits
       * in their My Orders and activates the ID once paid.
       */
      status: "COMPLETED" | "PENDING_PAYMENT"
      message: string
      partner: RegisteredPartner & { id: number }
      order: {
        id: number
        productName: string
        quantity: number
        totalAmount: number
        totalAmountFormatted: string
        bvTotal: number
        paymentMethod: "WALLET" | "RAZORPAY"
        paymentStatus?: "PAID" | "PENDING"
      }
    }
  | {
      /** Nothing is created until the Razorpay payment succeeds */
      status: "PAYMENT_REQUIRED"
      message: string
      razorpayOrderId: string
      /** Pass straight to the Razorpay checkout popup */
      checkout: InitiatePaymentResponse
      /** Paise */
      amount: number
      partnerName: string
    }

export async function registerWithOrder(
  input: RegisterWithOrderInput,
): Promise<RegisterWithOrderResult> {
  const { data } = await api.post<RegisterWithOrderResult>("/partner/register-with-order", input)
  return data
}
