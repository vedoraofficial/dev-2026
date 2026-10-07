import { z } from "zod"

import { emailSchema } from "@/lib/validators"

const digits = (value: string) => value.replace(/\D/g, "")

/** Indian mobile: 10 digits starting 6–9. "+91 98220 41288" and "9822041288" both pass. */
const mobile = z
  .string()
  .trim()
  .refine((v) => /^[6-9]\d{9}$/.test(digits(v).replace(/^91(?=\d{10}$)/, "")), {
    message: "Enter a 10-digit mobile number",
  })

const pincode = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Pincode is 6 digits")

/** The 10-digit number the backend stores: "+91 98220 41288" → "9822041288". */
export const toMobile10 = (value: string) => digits(value).replace(/^91(?=\d{10}$)/, "")

export const GENDERS = ["Male", "Female", "Other"] as const

/**
 * The new partner's own details — shared by Add Partner and the public referral join form.
 * Age, Aadhaar and PAN are checked here but the backend has no fields for them yet.
 */
const partnerDetailsShape = {
  fullName: z.string().trim().min(3, "Enter the full name"),
  age: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, "Enter age in years")
    .refine((v) => Number(v) >= 18 && Number(v) <= 99, "Partner must be 18 or older"),
  gender: z.enum(GENDERS, { message: "Choose a gender" }),
  mobile,
  email: emailSchema,
  aadhaar: z
    .string()
    .trim()
    // Just the shape here — the backend verifies the Aadhaar itself.
    .refine((v) => /^\d{12}$/.test(digits(v)), "Aadhaar is 12 digits"),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "PAN looks like ABCDE1234F"),
  address: z.string().trim().min(5, "Enter house / building and street"),
  /** Post office / locality picked from the pincode lookup (optional). */
  area: z.string().trim(),
  city: z.string().trim().min(2, "Enter the city"),
  state: z.string().trim().min(2, "Enter the state"),
  pincode: pincode,
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/\d/, "Add a number")
    .regex(/[^A-Za-z0-9]/, "Add a symbol"),
  confirmPassword: z.string(),
}

const passwordsMatch = {
  check: (v: { password: string; confirmPassword: string }) => v.password === v.confirmPassword,
  error: { path: ["confirmPassword"], message: "Passwords don't match" },
}

/** The joining order — product, shipping address and the agreement (no backend API yet). */
const joiningOrderShape = {
  productSku: z.string().min(1, "Choose a product"),

  shipName: z.string().trim().min(3, "Enter the receiver's name"),
  shipMobile: mobile,
  shipLine1: z.string().trim().min(5, "Enter house / building and street"),
  shipLandmark: z.string().trim(),
  shipArea: z.string().trim(),
  shipCity: z.string().trim().min(2, "Enter the city"),
  shipState: z.string().trim().min(2, "Enter the state"),
  shipPincode: pincode,

  agree: z.boolean().refine((v) => v, "Accept the agreement to continue"),
}

/**
 * Add Partner (Manual Placement). Sent to POST /api/partner/register-downline: name, email,
 * mobile, password, slot, upline, gender and address. Product and shipping are for the joining
 * order (no backend API yet).
 */
export const placementSchema = z
  .object({
    ...partnerDetailsShape,

    upline: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^VED\d{3,6}$/, "IDs look like VED000418"),
    slot: z.number().int().min(1),

    ...joiningOrderShape,
  })
  .refine(passwordsMatch.check, passwordsMatch.error)

export type PlacementInput = z.input<typeof placementSchema>
export type PlacementValues = z.output<typeof placementSchema>

/**
 * Public join from a referral link — the same form as Add Partner without upline and slot.
 * Sent to POST /api/partner/join; the sponsor comes from the link.
 */
export const referralJoinSchema = z
  .object({
    ...partnerDetailsShape,
    ...joiningOrderShape,
  })
  .refine(passwordsMatch.check, passwordsMatch.error)

export type ReferralJoinInput = z.input<typeof referralJoinSchema>
export type ReferralJoinValues = z.output<typeof referralJoinSchema>

/** The fields every partner form shares (what PartnerDetailsFields renders). */
const partnerDetailsSchema = z.object(partnerDetailsShape)
export type PartnerDetailsInput = z.input<typeof partnerDetailsSchema>
export type PartnerDetailsValues = z.output<typeof partnerDetailsSchema>

/** Details + joining order: what the product, shipping and confirm steps work with. */
const joiningFormSchema = z.object({ ...partnerDetailsShape, ...joiningOrderShape })
export type JoiningFormInput = z.input<typeof joiningFormSchema>
