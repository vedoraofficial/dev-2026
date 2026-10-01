/** Cuts `text` to `limit` words, appending "…" when it was longer. */
export function truncateWords(text: string, limit: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= limit) return text
  return words.slice(0, limit).join(" ") + "…"
}
