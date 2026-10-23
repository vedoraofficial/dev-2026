import { useMutation } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { toast } from "sonner"

import { FormField as Field } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendMobileOtp, verifyMobileOtp } from "@/features/placement/api"
import { toMobile10 } from "@/features/placement/schemas"
import { apiErrorMessage } from "@/lib/api"

/** Seconds before "Resend OTP" is allowed again (the backend allows 5 requests a minute). */
const RESEND_AFTER = 30

const isMobile10 = (value: string) => /^[6-9]\d{9}$/.test(value)

type Props = {
  /** The Mobile field as typed */
  mobile: string
  /** The number already verified, if any */
  verifiedMobile: string | null
  onVerified: (mobile: string) => void
  /** Add Partner's APIs unless given — the referral join page passes its public ones */
  sendOtp?: (mobile: string) => Promise<unknown>
  verifyOtp?: (input: { mobile: string; otp: string }) => Promise<{ mobile: string }>
}

/**
 * Add Partner's OTP field (next to Mobile): sends an OTP by SMS to the new partner's mobile and
 * checks the code they read out. Changing the number after verifying means verifying the new one.
 */
export function MobileOtpVerify({
  mobile,
  verifiedMobile,
  onVerified,
  sendOtp = sendMobileOtp,
  verifyOtp = verifyMobileOtp,
}: Props) {
  const number = toMobile10(mobile ?? "")
  const valid = isMobile10(number)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const otpInput = useRef<HTMLInputElement>(null)

  // Countdown for "Resend OTP"
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const send = useMutation({
    mutationFn: sendOtp,
    onSuccess: (_data, sentNumber: string) => {
      setSentTo(sentNumber)
      setOtp("")
      setOtpError(null)
      setResendIn(RESEND_AFTER)
      // The box was disabled until now — focus it once it is enabled
      window.setTimeout(() => otpInput.current?.focus())
      toast.success(`OTP sent to +91 ${sentNumber}`)
    },
  })

  const verify = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      setOtpError(null)
      onVerified(data.mobile)
    },
    onError: (err) => setOtpError(apiErrorMessage(err, "Couldn't verify the OTP. Try again.")),
  })

  const onVerify = () => {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit OTP")
      return
    }
    verify.mutate({ mobile: number, otp })
  }

  // The OTP box sits inside the Add Partner form — Enter verifies instead of submitting it.
  const onOtpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    onVerify()
  }

  const verified = valid && verifiedMobile === number
  const sentHere = valid && sentTo === number
  const sendError = send.isError
    ? apiErrorMessage(send.error, "Couldn't send the OTP. Try again.")
    : null

  return (
    <Field
      label="OTP"
      htmlFor="mobileOtp"
      error={verified ? undefined : (otpError ?? sendError ?? undefined)}
    >
      {verified ? (
        <p className="flex h-11 items-center gap-2 rounded-xl border border-success/30 bg-success-soft/40 px-3.5 text-sm text-success md:h-10">
          <Check className="size-4 shrink-0" aria-hidden />
          Mobile verified
        </p>
      ) : (
        <div className="flex gap-2">
          <Input
            ref={otpInput}
            id="mobileOtp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={sentHere ? "••••••" : "Send OTP first"}
            disabled={!sentHere}
            className="text-center font-mono tracking-[0.3em] placeholder:font-sans placeholder:tracking-normal"
            aria-invalid={!!otpError}
            value={sentHere ? otp : ""}
            onChange={(e) => {
              setOtp(e.target.value.replace(/D/g, "").slice(0, 6))
              setOtpError(null)
            }}
            onKeyDown={onOtpKeyDown}
          />
          {sentHere ? (
            <Button
              type="button"
              className="h-11 shrink-0 md:h-10"
              disabled={verify.isPending}
              onClick={onVerify}
            >
              {verify.isPending ? "Verifying…" : "Verify"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 md:h-10"
              disabled={!valid || send.isPending}
              onClick={() => send.mutate(number)}
            >
              {send.isPending ? "Sending…" : "Send OTP"}
            </Button>
          )}
        </div>
      )}
      {sentHere && !verified ? (
        <p className="flex flex-wrap items-center justify-between gap-x-2 text-[0.6875rem] text-muted-foreground">
          Sent to +91 {number}
          <button
            type="button"
            className="font-medium text-gold hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            disabled={resendIn > 0 || send.isPending}
            onClick={() => send.mutate(number)}
          >
            {send.isPending ? "Sending…" : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
          </button>
        </p>
      ) : null}
    </Field>
  )
}
