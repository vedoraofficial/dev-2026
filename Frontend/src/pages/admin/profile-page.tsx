import { useRef, useState, type ComponentProps, type ReactNode } from "react"
import { toast } from "sonner"

import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Details = { name: string; mobile: string; email: string; city: string }

const initialDetails: Details = {
  name: "Root Admin",
  mobile: "+91 98200 00108",
  email: "admin@vedoraofficial.in",
  city: "Pune, Maharashtra",
}

function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="eyebrow">
        {label}
      </Label>
      <Input id={id} {...props} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[0.8125rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

export function AdminProfilePage() {
  const [saved, setSaved] = useState(initialDetails)
  const [draft, setDraft] = useState(initialDetails)
  const [photo, setPhoto] = useState<string | undefined>()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const setField = (key: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }))

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result as string)
      toast.success("Profile photo updated")
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const saveChanges = () => {
    setSaved(draft)
    toast.success("Profile updated")
  }
  const cancelChanges = () => setDraft(saved)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      setPasswordError("Enter your current password")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters")
      return
    }
    setPasswordError("")
    setCurrentPassword("")
    setNewPassword("")
    toast.success("Password updated")
  }

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Root Admin account details"
        actions={
          <>
            <Button variant="quiet" disabled={!isDirty} onClick={cancelChanges}>
              Cancel
            </Button>
            <Button disabled={!isDirty} onClick={saveChanges}>
              Save changes
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <Panel className="flex flex-col items-center text-center">
              <PersonAvatar tone="gold" size="xl" src={photo} alt={saved.name} />
              <h2 className="mt-4 text-lg font-medium">{saved.name}</h2>
              <MonoId tone="gold" className="mt-0.5">
                VED108
              </MonoId>
              <StatusPill variant="gold" className="mt-3">
                Full access
              </StatusPill>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoPick}
              />
              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={() => photoInputRef.current?.click()}
              >
                Change photo
              </Button>
            </Panel>

            <Panel>
              <p className="mb-4 eyebrow">Access</p>
              <dl className="space-y-3">
                <Row label="Role" value="Root Admin" />
                <Row label="Oversight" value="Whole network" />
                <Row label="Income" value={<span className="text-muted-foreground">None</span>} />
              </dl>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader title="Personal details" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="name"
                  label="Full name"
                  value={draft.name}
                  onChange={setField("name")}
                  autoComplete="name"
                />
                <Field
                  id="mobile"
                  label="Mobile"
                  type="tel"
                  inputMode="tel"
                  value={draft.mobile}
                  onChange={setField("mobile")}
                  autoComplete="tel"
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={draft.email}
                  onChange={setField("email")}
                  autoComplete="email"
                />
                <Field
                  id="city"
                  label="City / State"
                  value={draft.city}
                  onChange={setField("city")}
                  autoComplete="address-level2"
                />
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Change password" />
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={updatePassword} noValidate>
                <Field
                  id="current"
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  aria-invalid={!!passwordError}
                />
                <Field
                  id="new"
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  aria-invalid={!!passwordError}
                />
                {passwordError ? (
                  <p role="alert" className="text-xs text-danger sm:col-span-2">
                    {passwordError}
                  </p>
                ) : null}
                <Button type="submit" className="sm:col-span-2 sm:w-fit">
                  Update password
                </Button>
              </form>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
