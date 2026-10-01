import { useRef, useState } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { DataTable, type Column } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatusPill } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
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
import { categoryLabel, maskedBank, withdrawalPill } from "@/features/wallet/labels"
import {
  useMyWithdrawals,
  useRequestWithdrawal,
  useWalletSummary,
  useWalletTransactions,
} from "@/features/wallet/queries"
import type { TransactionType, Withdrawal, WalletTransaction } from "@/features/wallet/types"
import { formatDateTime } from "@/lib/date"
import { formatINR, formatNumber, formatSignedINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10
/** POST /api/wallet/withdraw rejects anything below ₹100. */
const MIN_WITHDRAWAL = 100

const txnColumns: Column<WalletTransaction>[] = [
  {
    key: "description",
    header: "Description",
    primary: true,
    cell: (r) => (
      <div>
        <p className="text-[0.875rem] font-medium">{r.description || categoryLabel[r.category]}</p>
        <p className="text-[0.6875rem] text-muted-foreground">{formatDateTime(r.createdAt)}</p>
      </div>
    ),
  },
  {
    key: "category",
    header: "Type",
    cell: (r) => <StatusPill>{categoryLabel[r.category]}</StatusPill>,
  },
  {
    key: "balance",
    header: "Balance after",
    cell: (r) => (
      <span className="font-mono text-muted-foreground">
        {formatINR(paiseToRupees(r.balanceAfter))}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => {
      const rupees = paiseToRupees(r.amount) * (r.type === "DEBIT" ? -1 : 1)
      return (
        <span className={cn("font-mono", rupees > 0 ? "text-success" : "text-gold-light")}>
          {formatSignedINR(rupees)}
        </span>
      )
    },
  },
]

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

export function PartnerWalletPage() {
  const me = useSession((s) => s.user)
  const [tab, setTab] = useState<"all" | TransactionType>("all")
  const [page, setPage] = useState(1)
  const [amount, setAmount] = useState("")
  const [bankId, setBankId] = useState<string>("")
  const withdrawPanelRef = useRef<HTMLDivElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const summary = useWalletSummary()
  const transactions = useWalletTransactions({
    type: tab === "all" ? undefined : tab,
    page,
    limit: PAGE_SIZE,
  })
  const withdrawals = useMyWithdrawals()
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

  const pagination = transactions.data?.pagination

  const focusWithdrawPanel = () => {
    withdrawPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    amountInputRef.current?.focus()
  }

  const submitWithdrawal = () => {
    if (!canSubmit) return
    requestWithdrawal.mutate(
      { amount: numericAmount, bankId: Number(selectedBankId) },
      { onSuccess: () => setAmount("") },
    )
  }

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="Every credit is posted automatically by the commission engine"
        actions={<Button onClick={focusWithdrawPanel}>Request withdrawal</Button>}
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <Panel className="md:p-6">
              <QueryState query={summary} rows={2}>
                <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                  <div>
                    <p className="eyebrow text-gold">Available balance</p>
                    <p className="mt-2 font-display text-5xl leading-none md:text-6xl">
                      {formatINR(balance)}
                    </p>
                    <p className="mt-3 text-[0.6875rem] text-muted-foreground">
                      <MonoId tone="muted" className="text-[0.6875rem]">
                        {me?.vedId}
                      </MonoId>{" "}
                      · Total earned{" "}
                      <span className="font-mono">
                        {formatINR(paiseToRupees(summary.data?.totalEarned))}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="eyebrow text-[0.625rem]">Pending payout</p>
                      <p className="mt-1 font-display text-2xl text-gold-light">
                        {formatINR(paiseToRupees(summary.data?.lockedBalance))}
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow text-[0.625rem]">Withdrawn</p>
                      <p className="mt-1 font-display text-2xl">
                        {formatINR(paiseToRupees(summary.data?.totalWithdrawn))}
                      </p>
                    </div>
                  </div>
                </div>
              </QueryState>
            </Panel>

            <Panel>
              <PanelHeader
                title="Transaction history"
                aside={
                  <FilterTabs
                    aria-label="Transaction type"
                    value={tab}
                    onValueChange={(v) => {
                      setTab(v as typeof tab)
                      setPage(1)
                    }}
                    tabs={[
                      { value: "all", label: "All" },
                      { value: "CREDIT", label: "Credit" },
                      { value: "DEBIT", label: "Debit" },
                    ]}
                    className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  />
                }
              />
              <QueryState query={transactions}>
                <DataTable
                  columns={txnColumns}
                  rows={transactions.data?.items ?? []}
                  getRowKey={(r) => r.id}
                  emptyMessage="No transactions yet — commissions appear here once your team orders."
                />
                {pagination && pagination.totalPages > 1 ? (
                  <TablePagination
                    key={tab}
                    summary={`Page ${pagination.page} of ${pagination.totalPages} · ${formatNumber(pagination.total)} transactions`}
                    pages={pagination.totalPages}
                    onPageChange={setPage}
                  />
                ) : null}
              </QueryState>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <div ref={withdrawPanelRef} />
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
                      <Link
                        to={ROUTES.partner.profile}
                        className="font-medium text-gold hover:underline"
                      >
                        Manage banks
                      </Link>
                    </div>
                  )}
                </QueryState>
              </div>

              <p className="mt-4 rounded-xl border border-border bg-field/60 p-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
                Requests are reviewed by Admin. The amount is held as pending payout until it is
                approved or rejected.
              </p>
              <Button
                size="lg"
                className="mt-4 w-full"
                disabled={!canSubmit}
                onClick={submitWithdrawal}
              >
                {requestWithdrawal.isPending ? "Submitting…" : "Submit request"}
              </Button>
            </Panel>

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
          </div>
        </div>
      </PageBody>
    </>
  )
}
