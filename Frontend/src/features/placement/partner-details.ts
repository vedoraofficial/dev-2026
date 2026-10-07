import type { UseFormReturn } from "react-hook-form"

import {
  GENDERS,
  toMobile10,
  type JoiningFormInput,
  type PartnerDetailsValues,
} from "@/features/placement/schemas"
import type { Gender } from "@/types/user"

/** Form labels → the backend's gender values. */
export const GENDER_API: Record<(typeof GENDERS)[number], Gender> = {
  Male: "MALE",
  Female: "FEMALE",
  Other: "OTHER",
}

/** "123456789012" -> "1234 5678 9012" — digits only, capped at 12, grouped in 4s as you type. */
export function formatAadhaar(value: string): string {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 12)
  return digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ")
}

/** Strips anything that isn't a digit and caps the length — e.g. for Age and Mobile. */
export function limitDigits(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max)
}

/** The part of the backend request both join APIs share (register-downline and join). */
export function partnerDetailsPayload(values: PartnerDetailsValues) {
  return {
    name: values.fullName,
    email: values.email,
    mobile: toMobile10(values.mobile),
    password: values.password,
    gender: GENDER_API[values.gender],
    addressLine1: values.address,
    addressLine2: values.area || undefined,
    city: values.city,
    state: values.state,
    pincode: values.pincode,
  }
}

/** "Same as registered address" → the registered name, mobile and address become the shipping ones. */
export function copyRegisteredToShipping<T extends JoiningFormInput>(
  form: UseFormReturn<T, unknown, unknown>,
) {
  const { setValue, getValues } = form as unknown as UseFormReturn<JoiningFormInput>
  setValue("shipName", getValues("fullName"))
  setValue("shipMobile", getValues("mobile"))
  setValue("shipLine1", getValues("address"))
  setValue("shipLandmark", "")
  setValue("shipArea", getValues("area"))
  setValue("shipCity", getValues("city"))
  setValue("shipState", getValues("state"))
  setValue("shipPincode", getValues("pincode"))
}
