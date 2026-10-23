import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Button } from "@/components/ui/button"
import { useAdminChangeUserStatus, useAdminDeleteUser } from "@/features/account/queries"

type Props = {
  userId: number
  name: string
  /** Called once the account is deleted, e.g. to close the dialog it sits in */
  onDeleted?: () => void
}

/** [Admin] Activate / deactivate / block / delete one partner's account. */
export function PartnerAccountActions({ userId, name, onDeleted }: Props) {
  const changeStatus = useAdminChangeUserStatus()
  const deleteUser = useAdminDeleteUser()
  const busy = changeStatus.isPending || deleteUser.isPending

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="eyebrow">Account</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => changeStatus.mutate({ id: userId, status: "ACTIVE" })}
        >
          Activate
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => changeStatus.mutate({ id: userId, status: "INACTIVE" })}
        >
          Deactivate
        </Button>
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm" disabled={busy}>
              Block
            </Button>
          }
          title={`Block ${name}?`}
          description="They won't be able to sign in or have new partners placed under them. You can activate them again later."
          confirmLabel="Block"
          destructive
          onConfirm={() => changeStatus.mutate({ id: userId, status: "BLOCKED" })}
        />
        <ConfirmDialog
          trigger={
            <Button variant="destructive" size="sm" disabled={busy}>
              Delete
            </Button>
          }
          title={`Delete ${name}?`}
          description="This removes the account for good. Partners with orders or wallet history can't be deleted — block them instead."
          confirmLabel="Delete"
          destructive
          onConfirm={() => deleteUser.mutate(userId, { onSuccess: () => onDeleted?.() })}
        />
      </div>
    </div>
  )
}
