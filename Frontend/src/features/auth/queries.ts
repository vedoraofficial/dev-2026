import { forgotPassword, resetPassword } from "@/features/auth/api"
import { useApiMutation } from "@/lib/mutation"

export const useForgotPassword = () => useApiMutation(forgotPassword)

export const useResetPassword = () =>
  useApiMutation(resetPassword, { success: "Password reset — sign in with the new one" })
