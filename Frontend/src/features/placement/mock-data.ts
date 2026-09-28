/** VEDORA IDs already sitting in slots 1–14 under the chosen upline (sample data). */
export const takenSlots = [
  "VED000455",
  "VED000462",
  "VED000478",
  "VED000491",
  "VED000508",
  "VED000512",
  "VED000534",
  "VED000549",
  "VED000561",
  "VED000572",
  "VED000588",
  "VED000593",
  "VED000597",
  "VED000599",
]

/** The signed-in partner — the default upline, and the only one the sample data knows. */
export const defaultUpline = { id: "VED000418", name: "Rohit Deshmukh" }

/** What the backend returns after a successful placement (sample values until the API exists). */
export type PlacementResult = {
  vedoraId: string
  orderId: string
  txnId: string
  courier: string
  awb: string
  paidAt: Date
}

/**
 * DUMMY: stands in for the placement API + PhonePe payment + Shiprocket booking.
 * `count` = placements already made on this screen, so every placement gets new IDs.
 */
export function dummyPlacementResult(count: number): PlacementResult {
  return {
    vedoraId: `VED${String(6483 + count).padStart(6, "0")}`,
    orderId: `ORD-${String(1206 + count).padStart(5, "0")}`,
    txnId: `TXN-${884211 + count}`,
    courier: "Delhivery",
    awb: `149061${String(2208 + count).padStart(5, "0")}`,
    paidAt: new Date(),
  }
}

/** Next ID shown (read-only) on the form. */
export function previewNextId(count: number): string {
  return dummyPlacementResult(count).vedoraId
}
