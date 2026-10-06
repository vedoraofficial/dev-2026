import { zodResolver } from "@hookform/resolvers/zod"
import { Megaphone } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSendAnnouncement } from "@/features/notifications/queries"
import { announcementSchema, type AnnouncementValues } from "@/features/notifications/schemas"

const blank: AnnouncementValues = { title: "", message: "", audience: "ALL", founderVedId: "" }

/** [Admin] Send an in-app announcement to every partner, or to one Founder's team. */
export function AnnouncementDialog({
  founders,
}: {
  /** The Founders Admin can target, e.g. [{ vedId: "VED000001", name: "Founder One" }] */
  founders: { vedId: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const send = useSendAnnouncement()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: blank,
  })
  const audience = useWatch({ control, name: "audience" })

  const onSubmit = (v: AnnouncementValues) =>
    send.mutate(
      {
        title: v.title,
        message: v.message,
        target: v.audience,
        founderVedId: v.audience === "FOUNDER_TEAM" ? v.founderVedId : undefined,
      },
      {
        onSuccess: () => {
          reset(blank)
          setOpen(false)
        },
      },
    )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(blank)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Megaphone /> Send announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send announcement</DialogTitle>
          <DialogDescription>
            Appears in the bell of everyone you choose. It can&apos;t be edited after sending.
          </DialogDescription>
        </DialogHeader>
        <form
          id="announcement-form"
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.stopPropagation()
            void handleSubmit(onSubmit)(e)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Send to" htmlFor="ann-audience">
              <Controller
                control={control}
                name="audience"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="ann-audience" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All partners &amp; Founders</SelectItem>
                      <SelectItem value="FOUNDER_TEAM">One Founder&apos;s team</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            {audience === "FOUNDER_TEAM" ? (
              <FormField label="Founder" htmlFor="ann-founder" error={errors.founderVedId?.message}>
                <Controller
                  control={control}
                  name="founderVedId"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="ann-founder"
                        className="w-full"
                        aria-invalid={!!errors.founderVedId}
                      >
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        {founders.map((f) => (
                          <SelectItem key={f.vedId} value={f.vedId}>
                            {f.name} · {f.vedId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            ) : null}
          </div>
          <FormField label="Title" htmlFor="ann-title" error={errors.title?.message}>
            <Input
              id="ann-title"
              maxLength={120}
              placeholder="e.g. Festive bonus week"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
          </FormField>
          <FormField label="Message" htmlFor="ann-message" error={errors.message?.message}>
            <Textarea
              id="ann-message"
              rows={4}
              maxLength={1000}
              aria-invalid={!!errors.message}
              {...register("message")}
            />
          </FormField>
        </form>
        <DialogFooter>
          <Button type="submit" form="announcement-form" disabled={send.isPending}>
            {send.isPending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
