import { api } from "@/lib/api"

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
