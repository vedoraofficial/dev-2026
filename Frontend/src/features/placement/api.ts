import type { RegisteredPartner } from "@/features/placement/components/placement-success"
import type { partnerDetailsPayload } from "@/features/placement/partner-details"
import { api } from "@/lib/api"
import type { InitiatePaymentResponse } from "@/features/payments/api"

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

/** POST /api/partner/register-with-order — a new partner plus their joining order. */
export type RegisterWithOrderInput = ReturnType<typeof partnerDetailsPayload> & {
  /** 1–20; leave out for the lowest free slot */
  slotNumber?: number
  /** Place under this team member instead of yourself (you stay the sponsor) */
  parentVedId?: string
  productId: number
  quantity?: number
  /** WALLET pays from the sponsor's wallet now; RAZORPAY returns Razorpay checkout details */
  paymentMethod: "WALLET" | "RAZORPAY"
}

export type RegisterWithOrderResult =
  | {
      /** Paid from the wallet — the partner and their PAID joining order exist */
      status: "COMPLETED"
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
