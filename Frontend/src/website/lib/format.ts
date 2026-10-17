/** Single place for money / BV / number formatting (Indian digit grouping). */
const grouped = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 })

/** 1999 -> "₹1,999" */
export function formatINR(amount: number): string {
  return `₹${grouped.format(amount)}`
}

/** 1000 -> "1,000 BV" */
export function formatBV(value: number): string {
  return `${grouped.format(value)} BV`
}

/** 1000 -> "1,000" */
export function formatNumber(value: number): string {
  return grouped.format(value)
}
