import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { FormField } from "@/website/components/common/form-field"
import { PhoneInput } from "@/website/components/common/phone-input"
import { Button } from "@/website/components/ui/button"
import { Input } from "@/website/components/ui/input"
import { Textarea } from "@/website/components/ui/textarea"
import {
  CONTACT_TOPICS,
  contactSchema,
  type ContactValues,
} from "@/website/features/enquiries/schemas"
import { cn } from "@/website/lib/utils"

const blank: ContactValues = {
  name: "",
  mobile: "",
  email: "",
  reference: "",
  topic: "Order",
  message: "",
}

/** "Send us a message" on the contact page. */
export function ContactForm({ className }: { className?: string }) {
  const [sent, setSent] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: blank })

  // Frontend only for now: validate, clear the form and thank the visitor.
  const onSubmit = () => {
    reset(blank)
    setSent(true)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onChange={() => setSent(false)}
      noValidate
      className={cn("rounded-2xl border border-border bg-card p-5 md:p-7", className)}
    >
      <h2 className="text-[1.0625rem] font-bold">Send us a message</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="c-name" error={errors.name?.message}>
          <Input
            id="c-name"
            placeholder="Your name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </FormField>
        <FormField label="Mobile" htmlFor="c-mobile" error={errors.mobile?.message}>
          <PhoneInput id="c-mobile" aria-invalid={!!errors.mobile} {...register("mobile")} />
        </FormField>
        <FormField label="Email" htmlFor="c-email" error={errors.email?.message}>
          <Input
            id="c-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>
        <FormField label="Order or Partner ID" htmlFor="c-ref">
          <Input
            id="c-ref"
            placeholder="ORD-… or VED…"
            className="font-mono"
            {...register("reference")}
          />
        </FormField>

        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="mb-2 site-eyebrow">Topic</legend>
          <Controller
            control={control}
            name="topic"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Topic" className="flex flex-wrap gap-2">
                {CONTACT_TOPICS.map((t) => {
                  const active = field.value === t
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(t)}
                      className={cn(
                        "h-9 rounded-full border px-4 text-[0.75rem] transition-colors",
                        active
                          ? "border-gold bg-gold/15 font-semibold text-gold-light"
                          : "border-input text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </fieldset>

        <FormField
          label="Message"
          htmlFor="c-message"
          error={errors.message?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="c-message"
            placeholder="Tell us what happened"
            aria-invalid={!!errors.message}
            {...register("message")}
          />
        </FormField>
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full">
        Send message
      </Button>
      {sent ? (
        <p role="status" className="mt-4 text-center text-[0.8125rem] font-semibold text-gold">
          Thank you — our team will contact you shortly.
        </p>
      ) : null}
      <p className="mt-4 text-center text-[0.6875rem] text-muted-foreground">
        Attach photos or video by replying to our email. Protected by reCAPTCHA.
      </p>
    </form>
  )
}
