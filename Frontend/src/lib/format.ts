/** Single place for money / BV / number formatting (Indian digit grouping). */
const grouped = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 })

const trim = (n: number) => Number(n.toFixed(2)).toString()

/** 48600 -> "₹48,600" · -8000 -> "-₹8,000" */
export function formatINR(amount: number): string {
  const sign = amount < 0 ? "-" : ""
  return `${sign}₹${grouped.format(Math.abs(amount))}`
}

/** +200 -> "+₹200" · -8000 -> "-₹8,000" · 0 -> "₹0" */
export function formatSignedINR(amount: number): string {
  if (amount === 0) return formatINR(0)
  return `${amount > 0 ? "+" : ""}${formatINR(amount)}`
}

/** 1104000 -> "11.04L" · 12500000 -> "1.25Cr" · 4800 -> "4,800" */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e7) return `${trim(value / 1e7)}Cr`
  if (abs >= 1e5) return `${trim(value / 1e5)}L`
  return grouped.format(value)
}

/** 1104000 -> "₹11.04L" */
export function formatCompactINR(amount: number): string {
  return `₹${formatCompact(amount)}`
}

/** 1840 -> "1,840" */
export function formatNumber(value: number): string {
  return grouped.format(value)
}

/** 842000 -> "8,42,000 BV" */
export function formatBV(value: number): string {
  return `${grouped.format(value)} BV`
}
