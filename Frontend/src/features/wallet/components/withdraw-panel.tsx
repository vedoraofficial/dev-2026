import { useState, type Ref } from "react"
import { Link } from "react-router-dom"

import { DataTable, type Column } from "@/components/common/data-table"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBanks } from "@/features/account/queries"
import { maskedBank, withdrawalPill } from "@/features/wallet/labels"
import { useMyWithdrawals, useRequestWithdrawal, useWalletSummary } from "@/features/wallet/queries"
import type { Withdrawal } from "@/features/wallet/types"
import { formatDateTime } from "@/lib/date"
import { formatINR, formatNumber } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

/** POST /api/wallet/withdraw rejects anything below ₹100. */
const MIN_WITHDRAWAL = 100

/**
 * "Request withdrawal": amount (with quick amounts) and a verified payout bank.
 * Used on the partner and the admin Wallet — both go through POST /api/wallet/withdraw.
 */
export function WithdrawPanel({
  manageBanksHref,
  amountInputRef,
}: {
  /** Where "Manage banks" goes (the profile page with the bank accounts section). */
  manageBanksHref: string
  /** Lets the page focus the amount box (e.g. from a "Request withdrawal" header button). */
  amountInputRef?: Ref<HTMLInputElement>
}) {
  const [amount, setAmount] = useState("")
  const [bankId, setBankId] = useState("")
  const summary = useWalletSummary()
  const banks = useBanks()
  const requestWithdrawal = useRequestWithdrawal()

  const balance = paiseToRupees(summary.data?.availableBalance)
  const verifiedBanks = (banks.data ?? []).filter((b) => b.verificationStatus === "VERIFIED")
  // Default to the primary verified bank.
  const selectedBankId =
    bankId || String(verifiedBanks.find((b) => b.isPrimary)?.id ?? verifiedBanks[0]?.id ?? "")

  const quickAmounts = [500, 1000, Math.floor(balance)]
  const numericAmount = Number(amount) || 0
  const canSubmit =
    numericAmount >= MIN_WITHDRAWAL &&
    numericAmount <= balance &&
    !!selectedBankId &&
    !requestWithdrawal.isPending

  const submit = () => {
    if (!canSubmit) return
    requestWithdrawal.mutate(
      { amount: numericAmount, bankId: Number(selectedBankId) },
      { onSuccess: () => setAmount("") },
    )
  }

  return (
    <Panel>
      <PanelHeader title="Request withdrawal" />
      <div className="space-y-2">
        <Label htmlFor="amount" className="eyebrow">
          Amount
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
            ₹
          </span>
          <Input
            id="amount"
            ref={amountInputRef}
            inputMode="numeric"
            placeholder={`Min ${MIN_WITHDRAWAL}`}
            value={amount ? formatNumber(Number(amount)) : ""}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
            className="h-12 pl-8 font-mono text-lg md:h-12 md:text-lg"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((q, i) =>
            q >= MIN_WITHDRAWAL ? (
              <button
                key={`${i}-${q}`}
                type="button"
                onClick={() => setAmount(String(q))}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                {i === quickAmounts.length - 1 ? "Max" : formatINR(q)}
              </button>
            ) : null,
          )}
        </div>
        {numericAmount > balance ? (
          <p className="text-[0.6875rem] text-danger">
            Amount exceeds your available balance of {formatINR(balance)}.
          </p>
        ) : numericAmount > 0 && numericAmount < MIN_WITHDRAWAL ? (
          <p className="text-[0.6875rem] text-danger">
            Minimum withdrawal is {formatINR(MIN_WITHDRAWAL)}.
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-2">
        <p className="eyebrow">Payout to</p>
        <QueryState query={banks} rows={1}>
          {verifiedBanks.length > 0 ? (
            <Select value={selectedBankId} onValueChange={setBankId}>
              <SelectTrigger className="w-full" aria-label="Payout bank">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {verifiedBanks.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {maskedBank(b)}
                    {b.isPrimary ? " · Primary" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-xl border border-border bg-field px-3.5 py-3 text-[0.8125rem] text-muted-foreground">
              {banks.data?.length
                ? "Your bank is waiting for verification."
                : "No bank account added yet."}{" "}
              <Link to={manageBanksHref} className="font-medium text-gold hover:underline">
                Manage banks
              </Link>
            </div>
          )}
        </QueryState>
      </div>

      <p className="mt-4 rounded-xl border border-border bg-field/60 p-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
        Requests are reviewed by Admin. The amount is held as pending payout until it is approved or
        rejected.
        <span className="mt-1.5 block font-medium text-foreground">
          Once Admin approves, the amount is credited to your bank account within 24 hours.
        </span>
      </p>
      <Button size="lg" className="mt-4 w-full" disabled={!canSubmit} onClick={submit}>
        {requestWithdrawal.isPending ? "Submitting…" : "Submit request"}
      </Button>
    </Panel>
  )
}

const withdrawalColumns: Column<Withdrawal>[] = [
  {
    key: "amount",
    header: "Amount",
    primary: true,
    cell: (r) => (
      <div>
        <p className="font-mono text-[0.875rem] font-medium">
          {formatINR(paiseToRupees(r.amount))}
        </p>
        <p className="text-[0.6875rem] text-muted-foreground">{formatDateTime(r.createdAt)}</p>
      </div>
    ),
  },
  {
    key: "bank",
    header: "Bank",
    cell: (r) => <span className="font-mono text-xs">{maskedBank(r.bank)}</span>,
  },
  {
    key: "status",
    header: "Status",
    align: "right",
    cell: (r) => (
      <div className="md:text-right">
        <StatusPill variant={withdrawalPill[r.status].variant}>
          {withdrawalPill[r.status].label}
        </StatusPill>
        {r.adminRemarks ? (
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">{r.adminRemarks}</p>
        ) : null}
      </div>
    ),
  },
]

/** The signed-in user's own withdrawal requests (GET /api/wallet/withdrawals). */
export function MyWithdrawalsPanel() {
  const withdrawals = useMyWithdrawals()
  return (
    <Panel>
      <PanelHeader title="My withdrawals" />
      <QueryState
        query={withdrawals}
        empty={withdrawals.data?.length === 0}
        emptyMessage="No withdrawal requests yet."
      >
        <DataTable
          columns={withdrawalColumns}
          rows={withdrawals.data ?? []}
          getRowKey={(r) => r.id}
        />
      </QueryState>
    </Panel>
  )
}
