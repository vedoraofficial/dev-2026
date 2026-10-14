export const env = {
  /** Digits only, with country code. Defaults to VEDORA support, +91 91365 39436. */
  whatsappNumber: (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || "919136539436",
} as const
