import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { FormField } from "@/website/components/common/form-field"
import { PhoneInput } from "@/website/components/common/phone-input"
import { Button } from "@/website/components/ui/button"
import { Input } from "@/website/components/ui/input"
import {
  partnerInterestSchema,
  type PartnerInterestValues,
} from "@/website/features/enquiries/schemas"
import { cn } from "@/website/lib/utils"

const blank: PartnerInterestValues = { name: "", mobile: "", email: "", city: "", sponsorId: "" }

/** "Register your interest" — the team calls back to explain the plan and register the partner. */
export function PartnerInterestForm({ className }: { className?: string }) {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartnerInterestValues>({
    resolver: zodResolver(partnerInterestSchema),
    defaultValues: blank,
  })

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
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="pi-name" error={errors.name?.message}>
          <Input
            id="pi-name"
            placeholder="Your name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </FormField>
        <FormField label="Mobile" htmlFor="pi-mobile" error={errors.mobile?.message}>
          <PhoneInput id="pi-mobile" aria-invalid={!!errors.mobile} {...register("mobile")} />
        </FormField>
        <FormField label="Email" htmlFor="pi-email" error={errors.email?.message}>
          <Input
            id="pi-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>
        <FormField label="City" htmlFor="pi-city" error={errors.city?.message}>
          <Input
            id="pi-city"
            placeholder="City, State"
            autoComplete="address-level2"
            aria-invalid={!!errors.city}
            {...register("city")}
          />
        </FormField>
        <FormField
          label="Sponsor VEDORA ID (optional)"
          htmlFor="pi-sponsor"
          error={errors.sponsorId?.message}
          className="sm:col-span-2"
        >
          <Input
            id="pi-sponsor"
            placeholder="VED000000"
            className="font-mono uppercase placeholder:normal-case"
            aria-invalid={!!errors.sponsorId}
            {...register("sponsorId")}
          />
        </FormField>
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full">
        Submit interest
      </Button>
      {sent ? (
        <p role="status" className="mt-4 text-center text-[0.8125rem] font-semibold text-gold">
          Thank you — our team will contact you shortly.
        </p>
      ) : null}
      <p className="mt-4 text-center text-[0.6875rem] text-muted-foreground">
        By submitting you agree to be contacted by VEDORA. Protected by reCAPTCHA.
      </p>
    </form>
  )
}
