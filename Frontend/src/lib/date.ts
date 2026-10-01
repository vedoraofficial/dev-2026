/** Dates from the backend are ISO strings. Formatted in Indian style, local time. */
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
})
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

const parse = (iso: string | null | undefined) => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "2026-09-17T13:10:00Z" -> "17 Sep 2026" */
export function formatDate(iso: string | null | undefined): string {
  const d = parse(iso)
  return d ? dateFmt.format(d) : "—"
}

/** "2026-09-17T13:10:00Z" -> "17 Sep, 18:40" */
export function formatDateTime(iso: string | null | undefined): string {
  const d = parse(iso)
  return d ? dateTimeFmt.format(d) : "—"
}

/** First day of the current month as "YYYY-MM-01" (local time) — for `fromDate` filters. */
export function startOfMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`
}

/** "3 hours ago", "2 days ago" — for activity feeds. */
export function timeAgo(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return "—"
  const minutes = Math.round((Date.now() - d.getTime()) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days < 30 ? `${days} d ago` : formatDate(iso)
}
