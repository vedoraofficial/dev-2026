import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"

import { FormField } from "@/components/common/form-field"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMe, useProfileDetails, useSaveAccountDetails } from "@/features/account/queries"
import { personalSchema, type PersonalValues } from "@/features/account/schemas"
import type { Me, ProfileDetails } from "@/features/account/types"
import { combineQueries } from "@/lib/combine-queries"

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const

function toForm(me: Me | undefined, details: ProfileDetails | null | undefined): PersonalValues {
  return {
    name: me?.name ?? "",
    email: me?.email ?? "",
    mobile: me?.mobile ?? "",
    dateOfBirth: details?.dateOfBirth?.slice(0, 10) ?? "",
    gender: details?.gender ?? "",
    addressLine1: details?.addressLine1 ?? "",
    addressLine2: details?.addressLine2 ?? "",
    city: details?.city ?? "",
    state: details?.state ?? "",
    pincode: details?.pincode ?? "",
    profilePhoto: details?.profilePhoto ?? "",
  }
}

/** "" → left out, so an empty box never overwrites what the backend has with an empty string. */
const orUndefined = (v: string) => (v === "" ? undefined : v)

/**
 * Name, email, mobile, birth date, gender, address and photo link of the signed-in user.
 * Used by both the Partner and the Admin profile pages.
 */
export function PersonalDetailsForm() {
  const me = useMe()
  const details = useProfileDetails()
  const save = useSaveAccountDetails()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PersonalValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: toForm(undefined, undefined),
  })

  useEffect(() => {
    if (me.data && details.isSuccess) reset(toForm(me.data, details.data))
  }, [me.data, details.data, details.isSuccess, reset])

  const onSubmit = (v: PersonalValues) =>
    save.mutate({
      me: { name: v.name, email: v.email, mobile: v.mobile },
      details: {
        dateOfBirth: orUndefined(v.dateOfBirth),
        gender: v.gender === "" ? undefined : v.gender,
        addressLine1: orUndefined(v.addressLine1),
        addressLine2: orUndefined(v.addressLine2),
        city: orUndefined(v.city),
        state: orUndefined(v.state),
        pincode: orUndefined(v.pincode),
        profilePhoto: orUndefined(v.profilePhoto),
      },
    })

  return (
    <Panel>
      <PanelHeader title="Personal details" />
      <QueryState query={combineQueries(me, details)} rows={4}>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
            </FormField>
            <FormField label="Mobile" htmlFor="mobile" error={errors.mobile?.message}>
              <Input
                id="mobile"
                type="tel"
                inputMode="tel"
                maxLength={10}
                autoComplete="tel-national"
                aria-invalid={!!errors.mobile}
                {...register("mobile")}
              />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date of birth" htmlFor="dateOfBirth">
                <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
              </FormField>
              <FormField label="Gender" htmlFor="gender">
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger id="gender" className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            <FormField label="Address" htmlFor="addressLine1">
              <Input id="addressLine1" autoComplete="address-line1" {...register("addressLine1")} />
            </FormField>
            <FormField label="Area / landmark" htmlFor="addressLine2">
              <Input id="addressLine2" autoComplete="address-line2" {...register("addressLine2")} />
            </FormField>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-3">
              <FormField label="City" htmlFor="city">
                <Input id="city" autoComplete="address-level2" {...register("city")} />
              </FormField>
              <FormField label="State" htmlFor="state">
                <Input id="state" autoComplete="address-level1" {...register("state")} />
              </FormField>
              <FormField label="Pincode" htmlFor="pincode" error={errors.pincode?.message}>
                <Input
                  id="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  aria-invalid={!!errors.pincode}
                  {...register("pincode")}
                />
              </FormField>
            </div>
            <FormField
              label="Photo link"
              htmlFor="profilePhoto"
              error={errors.profilePhoto?.message}
              className="sm:col-span-2"
            >
              <Input
                id="profilePhoto"
                type="url"
                placeholder="https://…"
                aria-invalid={!!errors.profilePhoto}
                {...register("profilePhoto")}
              />
            </FormField>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="quiet"
              disabled={!isDirty || save.isPending}
              onClick={() => reset()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </QueryState>
    </Panel>
  )
}
