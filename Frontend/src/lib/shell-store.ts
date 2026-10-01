import { create } from "zustand"

/** Open/closed state of the mobile navigation drawer (shared by AppShell and PageHeader). */
type ShellState = {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

export const useShellStore = create<ShellState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}))
