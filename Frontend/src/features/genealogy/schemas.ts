import { z } from "zod"

/** POST /api/partner/join — public sign-up under a sponsor's VEDORA ID. */
export const joinSchema = z
  .object({
    referralId: z
      .string()
      .trim()
      .regex(/^VED\d{3,6}$/i, "Sponsor IDs look like VED000418"),
    name: z.string().trim().min(3, "Enter your full name"),
    email: z.string().trim().email("Enter a valid email"),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })
export type JoinValues = z.infer<typeof joinSchema>
