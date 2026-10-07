import { useEffect, type ChangeEvent } from "react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"

import { FormField as Field } from "@/components/common/form-field"
import { PasswordInput } from "@/components/common/password-input"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AreaSelect, PincodeHint } from "@/features/placement/components/pincode-lookup"
import { formatAadhaar, limitDigits } from "@/features/placement/partner-details"
import { isPincode, usePincodeLookup } from "@/features/placement/queries"
import { GENDERS, type PartnerDetailsInput } from "@/features/placement/schemas"
import { useEmailInputLock } from "@/hooks/use-email-input-lock"

export const textareaClass =
  "min-h-20 rounded-xl bg-field px-3.5 py-2.5 focus-visible:border-gold/60 focus-visible:ring-gold/20"

/**
 * The new partner's own details: name, age, gender, mobile, email, Aadhaar, PAN, address with
 * pincode lookup, and password. Shared by Add Partner and the public referral join form — pass
 * the form whose values include these fields.
 */
export function PartnerDetailsFields<T extends PartnerDetailsInput>({
  form,
}: {
  form: UseFormReturn<T, unknown, unknown>
}) {
  // The fields below exist on every form this is used with.
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form as unknown as UseFormReturn<PartnerDetailsInput>
  const emailLock = useEmailInputLock()

  // Pincode → city / state / areas. A found pincode fills City and State (still editable).
  const pincode = useWatch({ control, name: "pincode" })
  const lookup = usePincodeLookup(pincode ?? "")
  useEffect(() => {
    const info = lookup.data
    if (!info) return
    setValue("city", info.city, { shouldValidate: true })
    setValue("state", info.state, { shouldValidate: true })
    setValue("area", "")
  }, [lookup.data, setValue])

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field
          label="Full name"
          htmlFor="fullName"
          error={errors.fullName?.message}
          className="sm:col-span-2"
        >
          <Input
            id="fullName"
            autoComplete="off"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
        </Field>
        <Field label="Age" htmlFor="age" error={errors.age?.message}>
          <Input
            id="age"
            inputMode="numeric"
            maxLength={2}
            aria-invalid={!!errors.age}
            {...register("age", {
              onChange: (e: ChangeEvent<HTMLInputElement>) => {
                e.target.value = limitDigits(e.target.value, 2)
              },
            })}
          />
        </Field>
        <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="gender"
                  aria-invalid={!!errors.gender}
                  className="h-11 w-full rounded-xl bg-field px-3.5 text-[16px] data-[size=default]:h-11 md:h-10 md:text-sm md:data-[size=default]:h-10"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Mobile" htmlFor="mobile" error={errors.mobile?.message}>
          <Input
            id="mobile"
            type="tel"
            inputMode="tel"
            maxLength={10}
            placeholder="+91"
            aria-invalid={!!errors.mobile}
            {...register("mobile", {
              onChange: (e: ChangeEvent<HTMLInputElement>) => {
                e.target.value = limitDigits(e.target.value, 10)
              },
            })}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            aria-invalid={!!errors.email}
            onFocus={emailLock.onFocus}
            {...register("email", { onChange: emailLock.onChange })}
          />
        </Field>
        <Field label="New ID" htmlFor="newId">
          <Input
            id="newId"
            readOnly
            tabIndex={-1}
            value="Assigned by system"
            className="border-gold/40 bg-gold/10 font-mono text-gold"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Aadhaar number" htmlFor="aadhaar" error={errors.aadhaar?.message}>
          <Input
            id="aadhaar"
            inputMode="numeric"
            maxLength={14}
            placeholder="1234 5678 9012"
            className="font-mono"
            aria-invalid={!!errors.aadhaar}
            {...register("aadhaar", {
              onChange: (e: ChangeEvent<HTMLInputElement>) => {
                e.target.value = formatAadhaar(e.target.value)
              },
            })}
          />
        </Field>
        <Field label="PAN card" htmlFor="pan" error={errors.pan?.message}>
          <Input
            id="pan"
            maxLength={10}
            autoCapitalize="characters"
            placeholder="ABCDE1234F"
            className="font-mono uppercase placeholder:normal-case"
            aria-invalid={!!errors.pan}
            {...register("pan")}
          />
        </Field>
      </div>

      <Field label="Address" htmlFor="address" error={errors.address?.message}>
        <Textarea
          id="address"
          autoComplete="street-address"
          placeholder="House / building, street, area"
          className={textareaClass}
          aria-invalid={!!errors.address}
          {...register("address")}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Field label="Pincode" htmlFor="pincode" error={errors.pincode?.message}>
          <Input
            id="pincode"
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            className="font-mono"
            aria-invalid={!!errors.pincode}
            {...register("pincode")}
          />
          <PincodeHint lookup={lookup} complete={isPincode(pincode ?? "")} />
        </Field>
        <Field label="Area / post office" htmlFor="area">
          <Controller
            control={control}
            name="area"
            render={({ field }) => (
              <AreaSelect
                id="area"
                areas={lookup.data?.areas ?? []}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="City" htmlFor="city" error={errors.city?.message}>
          <Input
            id="city"
            autoComplete="address-level2"
            aria-invalid={!!errors.city}
            {...register("city")}
          />
        </Field>
        <Field label="State" htmlFor="state" error={errors.state?.message}>
          <Input
            id="state"
            autoComplete="address-level1"
            aria-invalid={!!errors.state}
            {...register("state")}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </Field>
      </div>
      <p className="text-[0.6875rem] text-muted-foreground">
        The VEDORA ID is created by the system when you register · the partner signs in with that ID
        and this password.
      </p>
    </>
  )
}
