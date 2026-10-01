import type { ReactNode } from "react"

import { MonoId } from "@/components/common/mono-id"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusPill } from "@/components/common/status-pill"
import type { TreeMember } from "@/features/genealogy/types"
import { cn } from "@/lib/utils"

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

type Props = {
  /** "Selected member" / "Selected node" */
  title: string
  member: TreeMember
  /** Name shown instead of the member's own, e.g. "Root Admin" */
  displayName?: string
  avatarTone?: "striped" | "gold" | "plain"
  /** Replaces the detail rows (e.g. the Root Admin's note) */
  note?: ReactNode
  /** Buttons at the bottom of the panel */
  children?: ReactNode
}

/** Side panel next to a GenealogyTree with the details of the member clicked in it. */
export function MemberPanel({
  title,
  member,
  displayName,
  avatarTone = "striped",
  note,
  children,
}: Props) {
  const full = (member.direct ?? 0) >= 20
  return (
    <aside
      aria-label={title}
      className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 md:p-5"
    >
      <p className="mb-4 eyebrow">{title}</p>
      <div className="mb-5 flex items-center gap-3">
        <PersonAvatar tone={avatarTone} size="md" />
        <div className="min-w-0">
          <p className="truncate font-medium">{displayName ?? member.fullName}</p>
          <MonoId tone="gold" className="text-[0.6875rem]">
            {member.id}
          </MonoId>
        </div>
      </div>

      {note ? (
        <div className="border-t border-border/70 pt-4 text-[0.8125rem] text-muted-foreground">
          {note}
        </div>
      ) : (
        <dl className="space-y-3 border-t border-border/70 pt-4 text-[0.8125rem]">
          <Row label="Sponsor" value={<MonoId>{member.sponsor}</MonoId>} />
          <Row label="Slot" value={<span className="font-mono">{member.slot} / 20</span>} />
          <Row label="Level" value={`L${member.level}`} />
          <Row label="Joined" value={member.joined} />
          <Row
            label="Direct slots"
            value={
              member.direct === null ? (
                <span className="text-muted-foreground">Open the card to load</span>
              ) : (
                <span className={cn("font-mono", full && "text-danger")}>
                  {member.direct} / 20{full ? " full" : ""}
                </span>
              )
            }
          />
          <Row
            label="Status"
            value={
              <StatusPill variant={member.status === "ACTIVE" ? "success" : "pending"}>
                {member.status
                  ? member.status.charAt(0) + member.status.slice(1).toLowerCase()
                  : "—"}
              </StatusPill>
            }
          />
        </dl>
      )}

      {full ? (
        <p className="mt-5 rounded-xl border border-border bg-field/60 p-3.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
          All 20 BV-eligible slots under this ID are taken.
        </p>
      ) : null}

      {children ? <div className="mt-5 xl:mt-auto">{children}</div> : null}
    </aside>
  )
}
