import { z } from "zod"

/**
 * A plain `.email()` check accepts any made-up TLD, so a typo like "name@site.comabc" (extra
 * characters typed past ".com") still looks like a valid address. This checks against the TLDs
 * this business actually uses, so nothing is accepted after the real top-level domain.
 */
const TLDS = [
  "com",
  "co.in",
  "in",
  "net",
  "org",
  "co",
  "info",
  "biz",
  "io",
  "edu.in",
  "edu",
  "gov.in",
  "gov",
  "ac.in",
  "me",
  "us",
  "uk",
]

export const EMAIL_RE = new RegExp(
  `^[^\\s@]+@[^\\s@]+\\.(${TLDS.join("|").replace(/\./g, "\\.")})$`,
  "i",
)

/**
 * The longest recognised TLD the domain ends with ("gmail.co.in" -> "co.in", not "in") — matched
 * by checking each suffix directly rather than one combined regex, which would otherwise let
 * greedy backtracking settle on a shorter alternative first.
 */
function matchedTld(value: string): string | null {
  const [local, domain] = value.split("@")
  if (!local || !domain || !domain.includes(".")) return null
  const lower = domain.toLowerCase()
  let best: string | null = null
  for (const tld of TLDS) {
    if (lower.endsWith(`.${tld}`) && (!best || tld.length > best.length)) best = tld
  }
  return best
}

/**
 * True once `value` is a complete, valid email AND its TLD can't still grow into a longer one we
 * also recognise — e.g. "name@site.co" stays open because "co" could become "com" or "co.in",
 * but "name@site.com" is final because nothing in the list extends "com".
 */
export function isFinalValidEmail(value: string): boolean {
  const tld = matchedTld(value)
  if (!tld) return false
  return !TLDS.some((t) => t !== tld && t.toLowerCase().startsWith(tld))
}

export const emailSchema = z
  .string()
  .trim()
  .refine((v) => EMAIL_RE.test(v), "Enter a valid email")
