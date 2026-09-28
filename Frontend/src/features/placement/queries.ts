import { useQuery } from "@tanstack/react-query"

import { lookupPincode } from "@/features/placement/api"

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
