import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FormField } from "@/components/common/form-field"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  useAddBank,
  useBanks,
  useDeleteBank,
  useSetPrimaryBank,
  useVerifyBank,
} from "@/features/account/queries"
import { bankSchema, type BankInput, type BankValues } from "@/features/account/schemas"
import type { BankVerificationStatus } from "@/features/account/types"

const verificationPill: Record<BankVerificationStatus, { label: string; variant: PillVariant }> = {
  VERIFIED: { label: "Verified", variant: "success" },
  PENDING: { label: "Verification pending", variant: "pending" },
  REJECTED: { label: "Rejected", variant: "danger" },
}

const blankBank: BankInput = {
  accountHolderName: "",
  accountNumber: "",
  bankName: "",
  ifscCode: "",
  isPrimary: false,
}

function AddBankForm({ first, onDone }: { first: boolean; onDone: () => void }) {
  const addBank = useAddBank()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BankInput, unknown, BankValues>({
    resolver: zodResolver(bankSchema),
    // The first account is always primary.
    defaultValues: { ...blankBank, isPrimary: first },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) => addBank.mutate(v, { onSuccess: onDone }))}
      className="space-y-4 rounded-xl border border-border bg-field/40 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Account holder"
          htmlFor="accountHolderName"
          error={errors.accountHolderName?.message}
        >
          <Input
            id="accountHolderName"
            autoComplete="name"
            aria-invalid={!!errors.accountHolderName}
            {...register("accountHolderName")}
          />
        </FormField>
        <FormField label="Bank name" htmlFor="bankName" error={errors.bankName?.message}>
          <Input id="bankName" aria-invalid={!!errors.bankName} {...register("bankName")} />
        </FormField>
        <FormField
          label="Account number"
          htmlFor="accountNumber"
          error={errors.accountNumber?.message}
        >
          <Input
            id="accountNumber"
            inputMode="numeric"
            maxLength={18}
            className="font-mono"
            aria-invalid={!!errors.accountNumber}
            {...register("accountNumber")}
          />
        </FormField>
        <FormField label="IFSC" htmlFor="ifscCode" error={errors.ifscCode?.message}>
          <Input
            id="ifscCode"
            maxLength={11}
            autoCapitalize="characters"
            placeholder="HDFC0001234"
            className="font-mono uppercase placeholder:normal-case"
            aria-invalid={!!errors.ifscCode}
            {...register("ifscCode")}
          />
        </FormField>
      </div>
      <Controller
        control={control}
        name="isPrimary"
        render={({ field }) => (
          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground">
            <Checkbox
              checked={field.value}
              disabled={first}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
            Use this account for payouts (primary)
          </label>
        )}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="quiet" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={addBank.isPending}>
          {addBank.isPending ? "Adding…" : "Add account"}
        </Button>
      </div>
    </form>
  )
}

/** The signed-in user's payout bank accounts: list, add, make primary, remove. */
export function BankAccountsPanel() {
  const banks = useBanks()
  const setPrimary = useSetPrimaryBank()
  const verify = useVerifyBank()
  const deleteBank = useDeleteBank()
  const [adding, setAdding] = useState(false)
  const list = banks.data ?? []

  return (
    <Panel>
      <PanelHeader
        title="Bank details for payout"
        aside={
          adding ? null : (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus /> Add account
            </Button>
          )
        }
      />
      <QueryState query={banks} rows={2}>
        <div className="space-y-3">
          {adding ? (
            <AddBankForm first={list.length === 0} onDone={() => setAdding(false)} />
          ) : null}
          {list.length === 0 && !adding ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No bank account yet — add one to receive withdrawals.
            </p>
          ) : null}
          {list.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-field/60 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[0.875rem] font-medium">
                  {b.bankName}{" "}
                  <span className="font-mono text-muted-foreground">
                    ****{b.accountNumber.slice(-4)}
                  </span>
                </p>
                <p className="text-[0.6875rem] text-muted-foreground">
                  {b.accountHolderName} · <span className="font-mono">{b.ifscCode}</span>
                </p>
                {b.verifiedName ? (
                  <p className="text-[0.6875rem] text-muted-foreground">
                    Name at bank: <span className="text-foreground/85">{b.verifiedName}</span>
                    {b.nameMatchScore != null ? ` · ${b.nameMatchScore}% match` : ""}
                  </p>
                ) : null}
                {b.verificationStatus === "REJECTED" && b.verificationFailedReason ? (
                  <p className="mt-0.5 text-[0.6875rem] text-danger">
                    {b.verificationFailedReason}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {b.isPrimary ? <StatusPill variant="gold">Primary</StatusPill> : null}
                <StatusPill variant={verificationPill[b.verificationStatus].variant}>
                  {verificationPill[b.verificationStatus].label}
                </StatusPill>
                {b.verificationStatus !== "VERIFIED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={verify.isPending}
                    onClick={() => verify.mutate(b.id)}
                  >
                    {verify.isPending && verify.variables === b.id ? "Verifying…" : "Verify now"}
                  </Button>
                ) : null}
                {!b.isPrimary ? (
                  <Button
                    size="sm"
                    variant="quiet"
                    disabled={setPrimary.isPending}
                    onClick={() => setPrimary.mutate(b.id)}
                  >
                    Make primary
                  </Button>
                ) : null}
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="destructive" disabled={deleteBank.isPending}>
                      Remove
                    </Button>
                  }
                  title="Remove this bank account?"
                  description={`${b.bankName} ****${b.accountNumber.slice(-4)} will no longer receive payouts.`}
                  confirmLabel="Remove"
                  destructive
                  onConfirm={() => deleteBank.mutate(b.id)}
                />
              </div>
            </div>
          ))}
          {list.length > 0 ? (
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              Withdrawals go only to a verified account. We check each account by sending ₹1 to it
              and matching the name at the bank; Admin can also verify it by hand.
            </p>
          ) : null}
        </div>
      </QueryState>
    </Panel>
  )
}
