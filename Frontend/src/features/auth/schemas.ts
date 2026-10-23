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

/** Forgot password, step 2: the 6-digit OTP sent by SMS. */
export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit OTP"),
})
export type OtpValues = z.infer<typeof otpSchema>

/** Forgot password, step 3 (POST /api/auth/reset-password) — the backend needs 6+ characters. */
export const newPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })
export type NewPasswordValues = z.infer<typeof newPasswordSchema>
