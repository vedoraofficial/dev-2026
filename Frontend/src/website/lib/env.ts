export const env = {
  /** Digits only, with country code (e.g. 919800000000). Empty opens WhatsApp's contact picker. */
  whatsappNumber: (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "",
} as const
