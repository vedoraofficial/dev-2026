import { MonoId } from "@/components/common/mono-id"
import { Panel } from "@/components/common/panel"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe, useProfileDetails } from "@/features/account/queries"
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
  const details = useProfileDetails()
  const user = me.data

  return (
    <Panel className="flex flex-col items-center text-center">
      <PersonAvatar
        tone={tone}
        size="xl"
        src={details.data?.profilePhoto ?? undefined}
        alt={user?.name ?? ""}
      />
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
