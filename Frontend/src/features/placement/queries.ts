import { useQuery } from "@tanstack/react-query"

import { lookupPincode, registerWithOrder } from "@/features/placement/api"
import { useApiMutation } from "@/lib/mutation"

export const isPincode = (value: string) => /^[1-9]\d{5}$/.test(value)

/** City / state / areas for a 6-digit pincode. Idle until the pincode is complete. */
export function usePincodeLookup(pincode: string) {
  const pin = pincode.trim()
  return useQuery({
    queryKey: ["placement", "pincode", pin],
    queryFn: () => lookupPincode(pin),
    enabled: isPincode(pin),
    // A pincode's city and state never change — no need to ask twice.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

/** Add Partner with a paid joining order. Refreshes everything a registration + order touches. */
export const useRegisterWithOrder = () =>
  useApiMutation(registerWithOrder, {
    success: (r) => (r.status === "PAYMENT_REQUIRED" ? "Opening Razorpay…" : r.message),
    invalidate: [["genealogy"], ["wallet"], ["orders"], ["stock"], ["products"]],
  })
