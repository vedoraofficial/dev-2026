import { useRef, type ChangeEvent, type FocusEvent } from "react"

import { isFinalValidEmail } from "@/lib/validators"

/**
 * Stops typing from continuing once the field already holds a complete, valid email whose TLD
 * can't grow any further — e.g. "name@site.com" can't become "name@site.comxyz". A TLD that's
 * still a prefix of another we recognise ("co" could become "com" or "co.in") is left alone so
 * it doesn't lock mid-word. Backspacing or editing mid-string unlocks it again. `onFocus` seeds
 * the lock from a value the field already had (e.g. loaded from a saved profile) before typing.
 */
export function useEmailInputLock() {
  const lockedRef = useRef("")

  const onFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (isFinalValidEmail(e.target.value)) lockedRef.current = e.target.value
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    const locked = lockedRef.current
    if (locked && next.startsWith(locked) && next.length > locked.length) {
      e.target.value = locked
      return
    }
    lockedRef.current = isFinalValidEmail(next) ? next : ""
  }

  return { onChange, onFocus }
}
