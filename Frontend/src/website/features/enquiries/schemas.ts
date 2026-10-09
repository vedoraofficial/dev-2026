import { z } from "zod"

const name = z.string().trim().min(3, "Enter your full name")
const mobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number")
const email = z.string().trim().email("Enter a valid email")

export const partnerInterestSchema = z.object({
  name,
  mobile,
  email,
  city: z.string().trim().min(2, "Enter your city and state"),
  sponsorId: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^VED\d{6}$/.test(v), "VEDORA IDs look like VED000123"),
})
export type PartnerInterestValues = z.infer<typeof partnerInterestSchema>

export const CONTACT_TOPICS = ["Order", "Product", "Payment", "Partner account", "Other"] as const

export const contactSchema = z.object({
  name,
  mobile,
  email,
  reference: z.string().trim(),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)"),
})
export type ContactValues = z.infer<typeof contactSchema>
