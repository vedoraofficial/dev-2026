import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { ArrowLeft, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { FormField } from "@/components/common/form-field"
import { PasswordInput } from "@/components/common/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { forgotPassword, resetPassword } from "@/features/auth/api"
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel"
import {
  forgotSchema,
  newPasswordSchema,
  otpSchema,
  type ForgotValues,
  type NewPasswordValues,
  type OtpValues,
} from "@/features/auth/schemas"
import { apiErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { normalizeVedId } from "@/lib/ved-id"

type Step = "id" | "otp" | "password"

const STEPS: { key: Step; label: string }[] = [
  { key: "id", label: "VEDORA ID" },
  { key: "otp", label: "Verify OTP" },
  { key: "password", label: "New password" },
]

/** Seconds before "Resend OTP" is allowed again (the backend allows 5 requests a minute). */
const RESEND_AFTER = 30

/** The backend calls the OTP a "reset token" — say it the way users see it. */
function otpErrorMessage(message: string): string {
  if (/too many failed attempts/i.test(message))
    return "Too many wrong attempts — this OTP no longer works. Tap Resend OTP for a new one."
  if (/expired/i.test(message)) return "This OTP has expired. Tap Resend OTP for a new one."
  if (/invalid reset token/i.test(message)) return "Incorrect OTP. Check the code and try again."
  return message
}

function StepIndicator({ current }: { current: Step }) {
  const index = STEPS.findIndex((s) => s.key === current)
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold",
              i < index && "bg-success text-primary-foreground",
              i === index && "bg-gold text-gold-foreground",
              i > index && "border border-border text-muted-foreground",
            )}
            aria-current={i === index ? "step" : undefined}
          >
            {i < index ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span
            className={cn(
              "truncate text-[0.6875rem]",
              i === index ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Forgot password: VEDORA ID → OTP sent by SMS to the ID's registered mobile → new password.
 * The backend checks the OTP when the new password is saved (POST /api/auth/reset-password),
 * so a wrong or expired OTP brings the user back to the OTP step with the reason.
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("id")
  const [vedId, setVedId] = useState("")
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)

  const idForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })
  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  })
  const passwordForm = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  // Countdown for "Resend OTP"
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const sendOtp = useMutation({
    mutationFn: (id: string) => forgotPassword(id),
    onSuccess: (_data, id) => {
      setVedId(id)
      setOtpError(null)
      otpForm.reset({ otp: "" })
      setResendIn(RESEND_AFTER)
      setStep("otp")
      toast.success("OTP sent to the mobile number registered with this ID")
    },
  })

  const reset = useMutation({
    mutationFn: (newPassword: string) => resetPassword({ vedId, resetToken: otp, newPassword }),
    onSuccess: () => {
      toast.success("Password reset — sign in with your new password")
      navigate(ROUTES.login, { replace: true, state: { vedId } })
    },
    onError: (err) => {
      // The OTP is only checked here: wrong / expired / locked → back to the OTP step.
      setOtpError(otpErrorMessage(apiErrorMessage(err, "Couldn't verify the OTP. Try again.")))
      otpForm.reset({ otp: "" })
      setStep("otp")
    },
  })

  const onSendOtp = ({ vedoraId }: ForgotValues) => sendOtp.mutate(normalizeVedId(vedoraId))
  const onVerifyOtp = ({ otp: code }: OtpValues) => {
    setOtp(code.trim())
    setOtpError(null)
    setStep("password")
  }
  const onResetPassword = ({ newPassword }: NewPasswordValues) => reset.mutate(newPassword)

  const idErrors = idForm.formState.errors
  const otpErrors = otpForm.formState.errors
  const passwordErrors = passwordForm.formState.errors

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <AuthBrandPanel />

      <section className="flex items-center bg-card/50 py-10 safe-x md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <Link
            to={ROUTES.login}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>

          <div>
            <h1 className="font-display text-[2rem] leading-tight font-normal md:text-4xl">
              Forgot password
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {step === "id" && "Enter your VEDORA ID. We'll send an OTP to its registered mobile."}
              {step === "otp" && (
                <>
                  Enter the 6-digit OTP sent to the mobile registered with{" "}
                  <span className="font-mono font-semibold text-gold">{vedId}</span>. It's valid for
                  15 minutes.
                </>
              )}
              {step === "password" && "OTP entered. Now choose a new password."}
            </p>
          </div>

          <StepIndicator current={step} />

          {step === "id" ? (
            <form className="space-y-5" noValidate onSubmit={idForm.handleSubmit(onSendOtp)}>
              <FormField label="VEDORA ID" htmlFor="forgotId" error={idErrors.vedoraId?.message}>
                <Input
                  id="forgotId"
                  placeholder="VED000418"
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoFocus
                  className="font-mono tracking-wide uppercase placeholder:normal-case"
                  aria-invalid={!!idErrors.vedoraId}
                  {...idForm.register("vedoraId")}
                />
              </FormField>
              {sendOtp.isError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-danger/40 bg-danger-soft/40 px-3.5 py-2.5 text-xs text-danger"
                >
                  {apiErrorMessage(sendOtp.error, "Couldn't send the OTP. Try again.")}
                </p>
              ) : null}
              <Button type="submit" size="lg" className="w-full" disabled={sendOtp.isPending}>
                {sendOtp.isPending ? "Sending OTP…" : "Send OTP"}
              </Button>
            </form>
          ) : null}

          {step === "otp" ? (
            <form className="space-y-5" noValidate onSubmit={otpForm.handleSubmit(onVerifyOtp)}>
              <FormField label="OTP" htmlFor="otp" error={otpErrors.otp?.message}>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="••••••"
                  autoFocus
                  className="text-center font-mono text-lg tracking-[0.6em]"
                  aria-invalid={!!otpErrors.otp || !!otpError}
                  {...otpForm.register("otp")}
                />
              </FormField>
              {otpError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-danger/40 bg-danger-soft/40 px-3.5 py-2.5 text-xs text-danger"
                >
                  {otpError}
                </p>
              ) : null}
              <Button type="submit" size="lg" className="w-full">
                Verify OTP
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="font-medium text-gold hover:underline"
                  onClick={() => {
                    setStep("id")
                    setOtpError(null)
                  }}
                >
                  Change ID
                </button>
                <button
                  type="button"
                  className="font-medium text-gold hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                  disabled={resendIn > 0 || sendOtp.isPending}
                  onClick={() => sendOtp.mutate(vedId)}
                >
                  {sendOtp.isPending
                    ? "Sending…"
                    : resendIn > 0
                      ? `Resend OTP in ${resendIn}s`
                      : "Resend OTP"}
                </button>
              </div>
            </form>
          ) : null}

          {step === "password" ? (
            <form
              className="space-y-5"
              noValidate
              onSubmit={passwordForm.handleSubmit(onResetPassword)}
            >
              <FormField
                label="New password"
                htmlFor="newPassword"
                error={passwordErrors.newPassword?.message}
              >
                <PasswordInput
                  id="newPassword"
                  autoComplete="new-password"
                  autoFocus
                  aria-invalid={!!passwordErrors.newPassword}
                  {...passwordForm.register("newPassword")}
                />
              </FormField>
              <FormField
                label="Confirm new password"
                htmlFor="confirmPassword"
                error={passwordErrors.confirmPassword?.message}
              >
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  aria-invalid={!!passwordErrors.confirmPassword}
                  {...passwordForm.register("confirmPassword")}
                />
              </FormField>
              <Button type="submit" size="lg" className="w-full" disabled={reset.isPending}>
                {reset.isPending ? "Resetting…" : "Reset password"}
              </Button>
              <button
                type="button"
                className="text-xs font-medium text-gold hover:underline"
                onClick={() => setStep("otp")}
              >
                Back to OTP
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  )
}
