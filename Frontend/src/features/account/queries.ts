import { useQuery } from "@tanstack/react-query"

import {
  addBank,
  adminCreateUser,
  changePassword,
  deleteBank,
  getBanks,
  getMe,
  getProfileDetails,
  setPrimaryBank,
  updateMe,
  updateProfileDetails,
} from "@/features/account/api"
import type { UpdateMeInput, UpdateProfileDetailsInput } from "@/features/account/types"
import { useApiMutation } from "@/lib/mutation"
import { useSession } from "@/lib/session"

export const accountKeys = {
  me: ["account", "me"] as const,
  profileDetails: ["account", "profile-details"] as const,
  banks: ["account", "banks"] as const,
}

export const useMe = () => useQuery({ queryKey: accountKeys.me, queryFn: getMe })

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

export const useAddBank = () =>
  useApiMutation(addBank, {
    success: "Bank account added — it will be verified before payouts",
    invalidate: [accountKeys.banks],
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
