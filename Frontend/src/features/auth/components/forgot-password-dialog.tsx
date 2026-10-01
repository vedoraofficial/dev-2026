import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useForgotPassword, useResetPassword } from "@/features/auth/queries"
import {
  forgotSchema,
  resetSchema,
  type ForgotValues,
  type ResetValues,
} from "@/features/auth/schemas"
import { normalizeVedId } from "@/lib/ved-id"

/**
 * Two steps: ask for a reset code for a VEDORA ID, then set a new password with it.
 * The backend has no SMS / email yet and returns the code in the response — it is filled in.
 */
export function ForgotPasswordDialog({ onReset }: { onReset?: (vedId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [vedId, setVedId] = useState<string | null>(null)
  const forgot = useForgotPassword()
  const reset = useResetPassword()

  const idForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { resetToken: "", newPassword: "", confirmPassword: "" },
  })

  const close = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setVedId(null)
      idForm.reset()
      resetForm.reset()
    }
  }

  const requestCode = ({ vedoraId }: ForgotValues) => {
    const id = normalizeVedId(vedoraId)
    forgot.mutate(id, {
      onSuccess: (r) => {
        setVedId(id)
        resetForm.reset({ resetToken: r.resetToken ?? "", newPassword: "", confirmPassword: "" })
      },
    })
  }

  const setPassword = ({ resetToken, newPassword }: ResetValues) => {
    if (!vedId) return
    reset.mutate(
      { vedId, resetToken, newPassword },
      {
        onSuccess: () => {
          onReset?.(vedId)
          close(false)
        },
      },
    )
  }

  const idErrors = idForm.formState.errors
  const resetErrors = resetForm.formState.errors

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <button type="button" className="font-medium text-gold hover:underline">
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vedId ? "Set a new password" : "Reset your password"}</DialogTitle>
          <DialogDescription>
            {vedId
              ? `Enter the reset code for ${vedId} and choose a new password.`
              : "Enter your VEDORA ID and we'll create a reset code."}
          </DialogDescription>
        </DialogHeader>

        {vedId ? (
          <form
            id="reset-form"
            className="space-y-4"
            noValidate
            onSubmit={(e) => {
              e.stopPropagation()
              void resetForm.handleSubmit(setPassword)(e)
            }}
          >
            <FormField
              label="Reset code"
              htmlFor="resetToken"
              error={resetErrors.resetToken?.message}
            >
              <Input
                id="resetToken"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="font-mono tracking-widest"
                aria-invalid={!!resetErrors.resetToken}
                {...resetForm.register("resetToken")}
              />
              {forgot.data?.resetToken ? (
                <p className="text-[0.6875rem] text-muted-foreground">
                  Filled in for you — there is no SMS / email service yet.
                </p>
              ) : null}
            </FormField>
            <FormField
              label="New password"
              htmlFor="resetNew"
              error={resetErrors.newPassword?.message}
            >
              <Input
                id="resetNew"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!resetErrors.newPassword}
                {...resetForm.register("newPassword")}
              />
            </FormField>
            <FormField
              label="Confirm new password"
              htmlFor="resetConfirm"
              error={resetErrors.confirmPassword?.message}
            >
              <Input
                id="resetConfirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!resetErrors.confirmPassword}
                {...resetForm.register("confirmPassword")}
              />
            </FormField>
          </form>
        ) : (
          <form
            id="forgot-form"
            noValidate
            onSubmit={(e) => {
              e.stopPropagation()
              void idForm.handleSubmit(requestCode)(e)
            }}
          >
            <FormField label="VEDORA ID" htmlFor="forgotId" error={idErrors.vedoraId?.message}>
              <Input
                id="forgotId"
                placeholder="VED000418"
                autoCapitalize="characters"
                spellCheck={false}
                className="font-mono uppercase placeholder:normal-case"
                aria-invalid={!!idErrors.vedoraId}
                {...idForm.register("vedoraId")}
              />
            </FormField>
          </form>
        )}

        <DialogFooter>
          {vedId ? (
            <>
              <Button variant="quiet" onClick={() => setVedId(null)}>
                Back
              </Button>
              <Button type="submit" form="reset-form" disabled={reset.isPending}>
                {reset.isPending ? "Saving…" : "Reset password"}
              </Button>
            </>
          ) : (
            <Button type="submit" form="forgot-form" disabled={forgot.isPending}>
              {forgot.isPending ? "Sending…" : "Get reset code"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
