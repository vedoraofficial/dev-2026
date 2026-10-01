import { z } from "zod"

/** VEDORA IDs look like VED108 (Admin), VED000001 (Founder) or VED000418 (Partner). */
export const loginSchema = z.object({
  vedoraId: z
    .string()
    .trim()
    .min(1, "Enter your VEDORA ID")
    .regex(/^VED\d{3,6}$/i, "IDs look like VED000418"),
  password: z.string().min(1, "Enter your password"),
})

export type LoginValues = z.infer<typeof loginSchema>

const vedoraId = z
  .string()
  .trim()
  .min(1, "Enter your VEDORA ID")
  .regex(/^VED\d{3,6}$/i, "IDs look like VED000418")

/** POST /api/auth/forgot-password */
export const forgotSchema = z.object({ vedoraId })
export type ForgotValues = z.infer<typeof forgotSchema>

/** POST /api/auth/reset-password — the backend needs 6+ characters. */
export const resetSchema = z
  .object({
    resetToken: z.string().trim().min(4, "Enter the code you received"),
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })
export type ResetValues = z.infer<typeof resetSchema>
