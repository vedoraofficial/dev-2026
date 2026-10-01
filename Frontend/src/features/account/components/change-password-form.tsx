import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import { FormField } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChangePassword } from "@/features/account/queries"
import { changePasswordSchema, type ChangePasswordValues } from "@/features/account/schemas"
import { cn } from "@/lib/utils"

/** 0–4: length ≥ 8, a number, a symbol, length ≥ 12 */
function passwordStrength(value: string): number {
  return [
    value.length >= 8,
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
    value.length >= 12,
  ].filter(Boolean).length
}

const strengthLabel = [
  "",
  "Weak",
  "Fair",
  "Good — add a symbol or make it longer for very strong",
  "Very strong",
]

const blank: ChangePasswordValues = { oldPassword: "", newPassword: "", confirmPassword: "" }

/** PATCH /api/user/password for whoever is signed in (Admin, Founder or Partner). */
export function ChangePasswordForm({ className }: { className?: string }) {
  const changePassword = useChangePassword()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: blank,
  })
  const strength = passwordStrength(useWatch({ control, name: "newPassword" }) ?? "")

  const onSubmit = ({ oldPassword, newPassword }: ChangePasswordValues) =>
    changePassword.mutate({ oldPassword, newPassword }, { onSuccess: () => reset(blank) })

  return (
    <form className={cn("space-y-4", className)} onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField label="Current password" htmlFor="oldPassword" error={errors.oldPassword?.message}>
        <Input
          id="oldPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.oldPassword}
          {...register("oldPassword")}
        />
      </FormField>
      <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.newPassword}
          {...register("newPassword")}
        />
        <div className="grid grid-cols-4 gap-1.5 pt-1" aria-hidden>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={cn("h-1 rounded-full", n <= strength ? "bg-success" : "bg-forest")}
            />
          ))}
        </div>
        <p className="min-h-4 text-[0.6875rem] text-muted-foreground" aria-live="polite">
          {strengthLabel[strength]}
        </p>
      </FormField>
      <FormField
        label="Confirm new password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>
      <Button type="submit" disabled={changePassword.isPending}>
        {changePassword.isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  )
}
