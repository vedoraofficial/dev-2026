import { z } from "zod"

const optionalText = z.string().trim()

/** PATCH /api/user (name, email, mobile) + PATCH /api/user/profile-details (the rest). */
export const personalSchema = z.object({
  name: z.string().trim().min(3, "Enter the full name"),
  email: z.string().trim().email("Enter a valid email"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
  dateOfBirth: optionalText,
  gender: z.enum(["", "MALE", "FEMALE", "OTHER"]),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  pincode: optionalText.refine((v) => v === "" || /^[1-9]\d{5}$/.test(v), "Pincode is 6 digits"),
  profilePhoto: optionalText.refine(
    (v) => v === "" || /^https?:\/\/\S+$/.test(v),
    "Enter an image link starting with http(s)://",
  ),
})
export type PersonalValues = z.infer<typeof personalSchema>

/** PATCH /api/user/password — the backend needs 6+ characters. */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })
  .refine((v) => v.newPassword !== v.oldPassword, {
    path: ["newPassword"],
    message: "Pick a password different from the current one",
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

/** POST /api/user/bank */
export const bankSchema = z.object({
  accountHolderName: z.string().trim().min(3, "Enter the name as in the bank"),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{9,18}$/, "Account number is 9–18 digits"),
  bankName: z.string().trim().min(2, "Enter the bank name"),
  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "IFSC looks like HDFC0001234"),
  isPrimary: z.boolean(),
})
export type BankInput = z.input<typeof bankSchema>
export type BankValues = z.output<typeof bankSchema>

/** POST /api/user — [Admin] creates a login (Partner, Pending, not placed in the tree). */
export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Enter the full name"),
  email: z.string().trim().email("Enter a valid email"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
  password: z.string().min(6, "At least 6 characters"),
})
export type CreateUserValues = z.infer<typeof createUserSchema>
