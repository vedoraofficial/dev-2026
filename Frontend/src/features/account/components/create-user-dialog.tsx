import { zodResolver } from "@hookform/resolvers/zod"
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
import { useAdminCreateUser } from "@/features/account/queries"
import { createUserSchema, type CreateUserValues } from "@/features/account/schemas"
import { useEmailInputLock } from "@/hooks/use-email-input-lock"

const blank: CreateUserValues = { name: "", email: "", mobile: "", password: "" }

/** [Admin] POST /api/user — a new login with the next free VEDORA ID. */
export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<{ vedId: string; name: string } | null>(null)
  const createUser = useAdminCreateUser()
  const emailLock = useEmailInputLock()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserValues>({ resolver: zodResolver(createUserSchema), defaultValues: blank })

  const close = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setCreated(null)
      reset(blank)
    }
  }

  const field = (
    name: keyof CreateUserValues,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <FormField label={label} htmlFor={`cu-${name}`} error={errors[name]?.message}>
      <Input
        id={`cu-${name}`}
        aria-invalid={!!errors[name]}
        onFocus={name === "email" ? emailLock.onFocus : undefined}
        {...props}
        {...register(name, name === "email" ? { onChange: emailLock.onChange } : undefined)}
      />
    </FormField>
  )

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button>Create user</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{created ? "User created" : "Create user"}</DialogTitle>
          <DialogDescription>
            {created
              ? "They can sign in with this ID and the password you set."
              : "Creates a Partner login with status Pending. It is not placed in the genealogy tree — use Add Partner for that."}
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-center">
            <MonoId tone="gold" className="text-2xl">
              {created.vedId}
            </MonoId>
            <p className="mt-1 text-sm">{created.name}</p>
          </div>
        ) : (
          <form
            id="create-user"
            className="grid gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={(e) => {
              e.stopPropagation()
              void handleSubmit((v) =>
                createUser.mutate(v, {
                  onSuccess: (r) => setCreated({ vedId: r.vedId, name: v.name }),
                }),
              )(e)
            }}
          >
            {field("name", "Full name", { autoComplete: "off" })}
            {field("mobile", "Mobile", { type: "tel", inputMode: "tel", maxLength: 10 })}
            {field("email", "Email", { type: "email", autoComplete: "off" })}
            {field("password", "Password", { type: "password", autoComplete: "new-password" })}
          </form>
        )}
        <DialogFooter>
          {created ? (
            <Button onClick={() => close(false)}>Done</Button>
          ) : (
            <Button type="submit" form="create-user" disabled={createUser.isPending}>
              {createUser.isPending ? "Creating…" : "Create user"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
