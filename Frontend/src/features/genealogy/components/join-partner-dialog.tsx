import { zodResolver } from "@hookform/resolvers/zod"
import { CircleCheck } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/common/form-field"
import { MonoId } from "@/components/common/mono-id"
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
import { useJoinPartner } from "@/features/genealogy/queries"
import { joinSchema, type JoinValues } from "@/features/genealogy/schemas"
import type { JoinedPartner } from "@/features/genealogy/types"

const blank: JoinValues = {
  referralId: "",
  name: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
}

/**
 * Public sign-up: a new partner joins under their sponsor's VEDORA ID and is placed in the
 * sponsor's lowest free slot. `onJoined` gets the new ID so the login form can be filled in.
 */
export function JoinPartnerDialog({ onJoined }: { onJoined?: (vedId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [joined, setJoined] = useState<JoinedPartner["partner"] | null>(null)
  const join = useJoinPartner()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinValues>({ resolver: zodResolver(joinSchema), defaultValues: blank })

  const close = (next: boolean) => {
    setOpen(next)
    if (!next) {
      if (joined) onJoined?.(joined.vedId)
      setJoined(null)
      reset(blank)
    }
  }

  const onSubmit = ({ confirmPassword: _confirm, ...input }: JoinValues) =>
    join.mutate(input, { onSuccess: (r) => setJoined(r.partner) })

  const text = (
    name: keyof JoinValues,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <FormField label={label} htmlFor={`join-${name}`} error={errors[name]?.message}>
      <Input id={`join-${name}`} aria-invalid={!!errors[name]} {...props} {...register(name)} />
    </FormField>
  )

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <button type="button" className="font-medium text-gold hover:underline">
          Join under your sponsor
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {joined ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CircleCheck className="size-5 text-success" /> Welcome to VEDORA
              </DialogTitle>
              <DialogDescription>
                {joined.name}, you&apos;re placed under {joined.sponsorName} ({joined.sponsorVedId})
                in slot {joined.slotNumber}.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-center">
              <p className="eyebrow text-[0.625rem]">Your VEDORA ID</p>
              <MonoId tone="gold" className="text-2xl">
                {joined.vedId}
              </MonoId>
              <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                Note it down — you sign in with this ID and your password.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => close(false)}>Sign in now</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Join as a partner</DialogTitle>
              <DialogDescription>
                You&apos;ll be placed in your sponsor&apos;s next free slot.
              </DialogDescription>
            </DialogHeader>
            <form
              id="join-form"
              className="grid gap-4 sm:grid-cols-2"
              noValidate
              onSubmit={(e) => {
                e.stopPropagation()
                void handleSubmit(onSubmit)(e)
              }}
            >
              {text("referralId", "Sponsor VEDORA ID", {
                placeholder: "VED000001",
                autoCapitalize: "characters",
                className: "font-mono uppercase placeholder:normal-case",
              })}
              {text("name", "Full name", { autoComplete: "name" })}
              {text("mobile", "Mobile", {
                type: "tel",
                inputMode: "tel",
                maxLength: 10,
                autoComplete: "tel-national",
              })}
              {text("email", "Email", { type: "email", autoComplete: "email" })}
              {text("password", "Password", { type: "password", autoComplete: "new-password" })}
              {text("confirmPassword", "Confirm password", {
                type: "password",
                autoComplete: "new-password",
              })}
            </form>
            <DialogFooter>
              <Button type="submit" form="join-form" disabled={join.isPending}>
                {join.isPending ? "Joining…" : "Join VEDORA"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
