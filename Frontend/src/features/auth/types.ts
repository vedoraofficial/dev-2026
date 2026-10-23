import type { SessionUser } from "@/types/session"

/** POST /api/auth/login */
export type LoginResponse = {
  access_token: string
  user: SessionUser
}

/** POST /api/auth/forgot-password. The OTP goes by SMS; `resetToken` only comes back in the backend's test mode. */
export type ForgotPasswordResponse = {
  message: string
  resetToken?: string
}

export type ResetPasswordInput = {
  vedId: string
  resetToken: string
  newPassword: string
}

export type ResetPasswordResponse = {
  success: boolean
  message: string
}
