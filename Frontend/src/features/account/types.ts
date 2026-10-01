import type { UserRole } from "@/types/session"
import type { Gender, UserStatus } from "@/types/user"

export type { Gender, UserStatus }
export type BankVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED"

/** GET /api/user — the signed-in user. (The backend also sends passwordHash; it is never read.) */
export type Me = {
  id: number
  vedId: string
  name: string
  email: string
  mobile: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export type UpdateMeInput = Partial<Pick<Me, "name" | "email" | "mobile">>

/** GET /api/user/profile-details (404 until first saved → `null`) */
export type ProfileDetails = {
  id: number
  dateOfBirth: string | null
  gender: Gender | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  pincode: string | null
  profilePhoto: string | null
}

export type UpdateProfileDetailsInput = Partial<Omit<ProfileDetails, "id">>

export type ChangePasswordInput = { oldPassword: string; newPassword: string }
export type ChangePasswordResponse = { success: boolean; message: string }

/** GET /api/user/bank */
export type Bank = {
  id: number
  accountHolderName: string
  accountNumber: string
  bankName: string
  ifscCode: string
  verificationStatus: BankVerificationStatus
  isPrimary: boolean
  createdAt: string
}

export type AddBankInput = {
  accountHolderName: string
  accountNumber: string
  bankName: string
  ifscCode: string
  isPrimary?: boolean
}

/** POST /api/user (Admin) */
export type CreateUserInput = { name: string; email: string; mobile: string; password: string }
export type CreatedUser = { message: string; vedId: string }
