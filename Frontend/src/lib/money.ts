/**
 * The backend stores money in paise (₹1 = 100 paise): wallet balances, transactions, order
 * totals and product prices. Convert at the edge, then format with `formatINR` from `lib/format`.
 */
export const paiseToRupees = (paise: number | string | null | undefined): number =>
  Number(paise ?? 0) / 100

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100)
