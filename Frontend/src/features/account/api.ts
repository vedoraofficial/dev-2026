import axios from "axios"

import type {
  AddBankInput,
  AdminVerifyBankInput,
  Bank,
  ChangePasswordInput,
  ChangePasswordResponse,
  CreatedUser,
  CreateUserInput,
  Me,
  ProfileDetails,
  UpdateMeInput,
  UpdateProfileDetailsInput,
  UserStatus,
} from "@/features/account/types"
import { api } from "@/lib/api"
import { AppError } from "@/lib/errors"

/** GET /api/user */
export async function getMe(): Promise<Me> {
  const { data } = await api.get<Me & { passwordHash?: string }>("/user")
  // Never keep the password hash the backend sends along.
  const { passwordHash: _ignored, ...me } = data
  return me
}

/** PATCH /api/user */
export async function updateMe(input: UpdateMeInput): Promise<Me> {
  const { data } = await api.patch<Me & { passwordHash?: string }>("/user", input)
  const { passwordHash: _ignored, ...me } = data
  return me
}

/** PATCH /api/user/password — the backend answers 200 with success:false on a wrong old password. */
export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResponse> {
  const { data } = await api.patch<ChangePasswordResponse>("/user/password", input)
  if (!data.success) throw new AppError(data.message || "Current password is wrong")
  return data
}

/** GET /api/user/profile-details — `null` when nothing has been saved yet (backend 404). */
export async function getProfileDetails(): Promise<ProfileDetails | null> {
  try {
    const { data } = await api.get<ProfileDetails>("/user/profile-details")
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

/** PATCH /api/user/profile-details */
export async function updateProfileDetails(
  input: UpdateProfileDetailsInput,
): Promise<ProfileDetails> {
  const { data } = await api.patch<ProfileDetails>("/user/profile-details", input)
  return data
}

/** GET /api/user/bank */
export async function getBanks(): Promise<Bank[]> {
  const { data } = await api.get<Bank[]>("/user/bank")
  return data
}

/** POST /api/user/bank */
export async function addBank(input: AddBankInput): Promise<Bank> {
  const { data } = await api.post<Bank>("/user/bank", input)
  return data
}

/** PATCH /api/user/bank/:id/primary */
export async function setPrimaryBank(id: number): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>(`/user/bank/${id}/primary`)
  return data
}

/** DELETE /api/user/bank/:id */
/** POST /api/user/bank/:id/verify — run the Penny Drop check again (₹1 sent to the account). */
export async function verifyBank(id: number): Promise<Bank> {
  const { data } = await api.post<Bank>(`/user/bank/${id}/verify`)
  return data
}

/** PATCH /api/user/admin/bank/:id/verify — [Admin] mark a bank VERIFIED or REJECTED by hand. */
export async function adminVerifyBank({ id, status, reason }: AdminVerifyBankInput): Promise<Bank> {
  const { data } = await api.patch<Bank>(`/user/admin/bank/${id}/verify`, { status, reason })
  return data
}

export async function deleteBank(id: number): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/user/bank/${id}`)
  return data
}

/** POST /api/user — [Admin] create a user account directly. Returns only the new ID. */
export async function adminCreateUser(input: CreateUserInput): Promise<CreatedUser> {
  const { data } = await api.post<CreatedUser>("/user", input)
  return data
}

/**
 * PATCH /api/user/status — [Admin].
 * ⚠ Backend bug: it changes the status of the signed-in admin (req.user), not another user.
 * Not wired to any button — calling it would block the admin's own account.
 */
export async function adminChangeOwnStatus(status: UserStatus): Promise<Me> {
  const { data } = await api.patch<Me>("/user/status", { status })
  return data
}

/**
 * DELETE /api/user — [Admin].
 * ⚠ Backend bug: it deletes the signed-in admin's own account. Not wired to any button.
 */
export async function adminDeleteOwnAccount(): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>("/user")
  return data
}
