import type {
  ForgotPasswordResponse,
  LoginResponse,
  ResetPasswordInput,
  ResetPasswordResponse,
} from "@/features/auth/types"
import { api } from "@/lib/api"
import { normalizeVedId } from "@/lib/ved-id"

/** POST /api/auth/login */
export async function login(vedoraId: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    vedId: normalizeVedId(vedoraId),
    password,
  })
  return data
}

/** POST /api/auth/forgot-password — creates a 6-digit reset OTP for the ID. */
export async function forgotPassword(vedoraId: string): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>("/auth/forgot-password", {
    vedId: normalizeVedId(vedoraId),
  })
  return data
}

/** POST /api/auth/reset-password */
export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>("/auth/reset-password", {
    ...input,
    vedId: normalizeVedId(input.vedId),
  })
  return data
}
