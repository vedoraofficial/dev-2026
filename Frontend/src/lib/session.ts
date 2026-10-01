import { create } from "zustand"

import type { SessionUser } from "@/types/session"

const STORAGE_KEY = "vedora.session"

type StoredSession = { token: string; user: SessionUser }

type SessionState = {
  token: string | null
  user: SessionUser | null
  /** `remember` keeps the login after the browser closes; otherwise it lasts for this tab only. */
  signIn: (session: StoredSession, remember: boolean) => void
  signOut: () => void
  /** Keep the stored user in step after a profile edit (name / email changed). */
  updateUser: (patch: Partial<SessionUser>) => void
}

/** Storage can be blocked (private mode, site settings) — never let that break the app. */
function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

/** Whichever storage holds the session now (local = remembered). */
function storedIn(): Storage | null {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return localStorage
    if (sessionStorage.getItem(STORAGE_KEY)) return sessionStorage
  } catch {
    // blocked
  }
  return null
}

function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clear
  }
}

const initial = readStored()

/** The signed-in user and their JWT. Read anywhere with `useSession`. */
export const useSession = create<SessionState>((set, get) => ({
  token: initial?.token ?? null,
  user: initial?.user ?? null,
  signIn: (session, remember) => {
    clearStored()
    try {
      ;(remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      // Still signed in for this page load, just not remembered.
    }
    set({ token: session.token, user: session.user })
  },
  signOut: () => {
    clearStored()
    set({ token: null, user: null })
  },
  updateUser: (patch) => {
    const { token, user } = get()
    if (!token || !user) return
    const next = { ...user, ...patch }
    try {
      storedIn()?.setItem(STORAGE_KEY, JSON.stringify({ token, user: next }))
    } catch {
      // Updated for this page load only.
    }
    set({ user: next })
  },
}))
