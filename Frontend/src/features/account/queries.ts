import { useQuery } from "@tanstack/react-query"

import {
  addBank,
  adminVerifyBank,
  adminChangeUserStatus,
  adminCreateUser,
  adminDeleteUser,
  changePassword,
  deleteBank,
  getBanks,
  getMe,
  getProfileDetails,
  setPrimaryBank,
  updateMe,
  updateProfileDetails,
  verifyBank,
} from "@/features/account/api"
import type {
  Bank,
  UpdateMeInput,
  UpdateProfileDetailsInput,
  UserStatus,
} from "@/features/account/types"
import { useApiMutation } from "@/lib/mutation"
import { useSession } from "@/lib/session"

export const accountKeys = {
  me: ["account", "me"] as const,
  profileDetails: ["account", "profile-details"] as const,
  banks: ["account", "banks"] as const,
}

export const useMe = () => useQuery({ queryKey: accountKeys.me, queryFn: getMe })

/** True while the signed-in partner's ID waits for its joining payment ("pay later"). */
export const useIsPendingPayment = () => useMe().data?.status === "PENDING"

export const useProfileDetails = () =>
  useQuery({ queryKey: accountKeys.profileDetails, queryFn: getProfileDetails })

export const useBanks = () => useQuery({ queryKey: accountKeys.banks, queryFn: getBanks })

export const useUpdateMe = () =>
  useApiMutation(updateMe, { success: "Profile updated", invalidate: [accountKeys.me] })

export const useUpdateProfileDetails = () =>
  useApiMutation(updateProfileDetails, {
    success: "Details saved",
    invalidate: [accountKeys.profileDetails],
  })

/** Saves the profile form in one go: basic details (PATCH /user) then the extended ones. */
export const useSaveAccountDetails = () => {
  const updateUser = useSession((s) => s.updateUser)
  return useApiMutation(
    async ({ me, details }: { me: UpdateMeInput; details: UpdateProfileDetailsInput }) => {
      const saved = await updateMe(me)
      await updateProfileDetails(details)
      return saved
    },
    {
      success: "Profile updated",
      invalidate: [accountKeys.me, accountKeys.profileDetails],
      onSuccess: (saved) => updateUser({ name: saved.name, email: saved.email }),
    },
  )
}

export const useChangePassword = () =>
  useApiMutation(changePassword, { success: "Password updated" })

/** Toast text after RazorpayX Penny Drop check. */
const verificationResult = (b: Bank) =>
  b.verificationStatus === "VERIFIED"
    ? `${b.bankName} ****${b.accountNumber.slice(-4)} verified via RazorpayX penny drop — you can withdraw to it`
    : b.verificationStatus === "REJECTED"
      ? `Bank couldn't be verified: ${b.verificationFailedReason ?? "check the details"}`
      : "Bank account verified successfully"

/** Adding a bank also runs the Penny Drop check, so the toast says how it went. */
export const useAddBank = () =>
  useApiMutation(addBank, { success: verificationResult, invalidate: [accountKeys.banks] })

export const useVerifyBank = () =>
  useApiMutation(verifyBank, { success: verificationResult, invalidate: [accountKeys.banks] })

/** [Admin] Verify or reject a bank by hand (from the "Bank account to verify" notification). */
export const useAdminVerifyBank = () =>
  useApiMutation(adminVerifyBank, {
    success: (_b, v) =>
      v.status === "VERIFIED" ? "Bank account verified" : "Bank account rejected",
    invalidate: [accountKeys.banks, ["notifications"]],
  })

export const useSetPrimaryBank = () =>
  useApiMutation(setPrimaryBank, {
    success: "Primary bank updated",
    invalidate: [accountKeys.banks],
  })

export const useDeleteBank = () =>
  useApiMutation(deleteBank, { success: "Bank account removed", invalidate: [accountKeys.banks] })

export const useAdminCreateUser = () =>
  useApiMutation(adminCreateUser, { success: (u) => `User ${u.vedId} created` })

const STATUS_TOAST: Record<UserStatus, string> = {
  ACTIVE: "Account activated",
  INACTIVE: "Account deactivated",
  BLOCKED: "Account blocked — they can no longer sign in",
  PENDING: "Account set to pending",
}

/** [Admin] Block / activate a partner. Refreshes the genealogy, which lists them. */
export const useAdminChangeUserStatus = () =>
  useApiMutation(adminChangeUserStatus, {
    success: (_r, v) => STATUS_TOAST[v.status],
    invalidate: [["genealogy"]],
  })

/** [Admin] Delete a partner with no orders or wallet history. */
export const useAdminDeleteUser = () =>
  useApiMutation(adminDeleteUser, {
    success: (r) => r.message || "Partner deleted",
    invalidate: [["genealogy"]],
  })
