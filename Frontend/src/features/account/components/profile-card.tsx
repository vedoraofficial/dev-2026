import { Camera, Loader2 } from "lucide-react"
import { useRef, type ChangeEvent } from "react"

import { MonoId } from "@/components/common/mono-id"
import { Panel } from "@/components/common/panel"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/features/account/queries"
import { useProfilePhoto } from "@/features/account/use-profile-photo"
import { formatDate } from "@/lib/date"
import { roleLabel } from "@/types/session"
import type { UserStatus } from "@/types/user"

const statusPill: Record<UserStatus, { label: string; variant: PillVariant }> = {
  ACTIVE: { label: "Active", variant: "success" },
  PENDING: { label: "Pending activation", variant: "pending" },
  INACTIVE: { label: "Inactive", variant: "neutral" },
  BLOCKED: { label: "Blocked", variant: "danger" },
}

/** Photo, name, VEDORA ID, role and account status of the signed-in user. */
export function ProfileCard({ tone = "striped" }: { tone?: "striped" | "gold" }) {
  const me = useMe()
  const photo = useProfilePhoto()
  const user = me.data
  const fileInputRef = useRef<HTMLInputElement>(null)
  const busy = photo.upload.isPending || photo.remove.isPending

  const onPickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) photo.upload.mutate(file)
  }

  return (
    <Panel className="flex flex-col items-center text-center">
      <div className="relative">
        <PersonAvatar
          tone={tone}
          size="xl"
          src={photo.src}
          alt={user?.name ?? ""}
        />
        {busy ? (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-background/60">
            <Loader2 className="size-6 animate-spin text-gold" aria-label="Saving photo" />
          </span>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change photo"
          className="absolute right-0 bottom-0 grid size-7 place-items-center rounded-full border border-border bg-card text-gold shadow-sm hover:bg-muted"
        >
          <Camera className="size-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickPhoto}
        />
      </div>
      {photo.hasPhoto ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => photo.remove.mutate()}
          className="mt-2 text-[0.6875rem] text-muted-foreground hover:text-danger hover:underline disabled:opacity-50"
        >
          Remove photo
        </button>
      ) : null}
      {user ? (
        <>
          <h2 className="mt-4 text-lg font-medium">{user.name}</h2>
          <MonoId tone="gold" className="mt-0.5">
            {user.vedId}
          </MonoId>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <StatusPill variant="gold">{roleLabel[user.role]}</StatusPill>
            <StatusPill variant={statusPill[user.status].variant}>
              {statusPill[user.status].label}
            </StatusPill>
          </div>
          <p className="mt-3 text-[0.6875rem] text-muted-foreground">
            Member since {formatDate(user.createdAt)}
          </p>
        </>
      ) : (
        <div className="mt-4 w-full space-y-2">
          <Skeleton className="mx-auto h-5 w-32" />
          <Skeleton className="mx-auto h-4 w-20" />
        </div>
      )}
    </Panel>
  )
}
