import { DataTable, type Column } from "@/components/common/data-table"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { ProgressBar } from "@/components/common/progress-bar"
import { QueryState } from "@/components/common/query-state"
import { useSrpLedger, useSrpSummary } from "@/features/srp/queries"
import type { SrpLedgerEntry } from "@/features/srp/types"
import { formatDateTime } from "@/lib/date"
import { cn } from "@/lib/utils"

const REASON_LABEL: Record<SrpLedgerEntry["reason"], string> = {
  PARTNER_JOIN_SALE: "Partner joined & activated",
  SELF_PURCHASE: "Product purchase",
  MONTHLY_AUTO_DEDUCT: "No sale — auto-deducted",
}

export type SrpLedgerRow = {
  id: string
  date: string
  event: string
  reference: string
  change: number
  balance: number
}

const SRP_TIERS = [
  { points: 10, label: "1 month" },
  { points: 20, label: "2 months" },
  { points: 30, label: "3 months" },
  { points: 40, label: "4 months" },
  { points: 50, label: "5 months" },
] as const

const columns: Column<SrpLedgerRow>[] = [
  {
    key: "date",
    header: "Date",
    cell: (r) => <span className="text-muted-foreground">{r.date}</span>,
  },
  {
    key: "event",
    header: "Event",
    primary: true,
    cell: (r) => <span className="font-medium">{r.event}</span>,
  },
  { key: "ref", header: "Reference", cell: (r) => <MonoId>{r.reference}</MonoId> },
  {
    key: "change",
    header: "Change",
    cell: (r) => (
      <span className={cn("font-mono", r.change > 0 ? "text-success" : "text-danger")}>
        {r.change > 0 ? "+" : "-"}
        {Math.abs(r.change)}
      </span>
    ),
  },
  {
    key: "balance",
    header: "Balance",
    align: "right",
    cell: (r) => <span className="font-mono">{r.balance}</span>,
  },
]

export function PartnerSrpWalletPage() {
  const summary = useSrpSummary()
  const ledger = useSrpLedger()

  const maxSrp = 50
  const balance = summary.data?.balance ?? 0
  const earned = summary.data?.totalEarned ?? 0
  const redeemed = summary.data?.totalRedeemed ?? 0
  const monthsRedeemable = summary.data?.monthsRedeemable ?? 0

  const ledgerRows: SrpLedgerRow[] = (ledger.data ?? []).map((r) => ({
    id: String(r.id),
    date: formatDateTime(r.createdAt),
    event: REASON_LABEL[r.reason] ?? r.reason,
    reference: r.referenceType && r.referenceId ? `${r.referenceType} #${r.referenceId}` : "—",
    change: r.type === "EARN" ? r.amount : -r.amount,
    balance: r.balanceAfter,
  }))

  const activationTimeline = (ledger.data ?? [])
    .filter((r) => r.reason === "MONTHLY_AUTO_DEDUCT")
    .map((r) => ({
      month: formatDateTime(r.createdAt),
      note: "No sale that month — 10 SRP auto-deducted to stay active",
      status: "Auto-renewed",
    }))

  return (
    <>
      <PageHeader title="SRP Wallet" subtitle="Sales Reward Points · 2 SRP per confirmed sale" />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel className="md:p-6">
            <QueryState query={summary} rows={2}>
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <p className="eyebrow text-gold">SRP balance</p>
                <p className="mt-2 font-display text-5xl leading-none md:text-6xl">
                  {balance} <span className="text-2xl text-muted-foreground">SRP</span>
                </p>
              </div>
              <div className="sm:text-right">
                <p className="eyebrow text-[0.625rem]">Redeemable for</p>
                <p className="mt-1 font-display text-2xl text-success">
                  {monthsRedeemable > 0
                    ? `${monthsRedeemable} month${monthsRedeemable > 1 ? "s" : ""} free activation`
                    : "Not enough SRP yet"}
                </p>
              </div>
            </div>

            <ProgressBar
              value={balance}
              max={maxSrp}
              label="SRP progress towards 50"
              className="mt-6 h-2.5"
            />

            <div className="mt-5 grid grid-cols-5 gap-2">
              {SRP_TIERS.map((t) => {
                const reached = balance >= t.points
                return (
                  <div
                    key={t.points}
                    className={cn(
                      "rounded-xl border px-1 py-3 text-center",
                      reached
                        ? "border-gold/50 bg-gold/10"
                        : "border-border bg-field/60 text-muted-foreground",
                    )}
                  >
                    <p className={cn("font-mono text-base", reached && "text-gold-light")}>
                      {t.points}
                    </p>
                    <p className="mt-0.5 text-[0.5625rem] sm:text-[0.625rem]">for {t.label}</p>
                  </div>
                )
              })}
            </div>

            <p className="mt-5 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground">
              Earn <strong className="font-medium text-gold">2 SRP</strong> for every confirmed
              bracelet sale. If you make no sale in a month and hold 10 SRP or more, the system
              deducts 10 SRP automatically and keeps your ID active for the next month.
            </p>
            </QueryState>
          </Panel>

          <Panel>
            <PanelHeader title="Activation timeline" />
            {activationTimeline.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No monthly activation records yet.
              </p>
            ) : (
              <ul>
                {activationTimeline.map((m) => (
                  <li
                    key={m.month}
                    className="flex items-center justify-between gap-3 border-b border-border/70 py-3.5 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-[0.875rem] font-medium">{m.month}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">{m.note}</p>
                    </div>
                    <span className="text-xs font-medium text-success">{m.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel>
          <PanelHeader
            title="SRP ledger"
            aside={
              <span className="font-mono text-gold">
                +{earned} earned · -{redeemed} redeemed
              </span>
            }
          />
          <QueryState query={ledger}>
          <DataTable
            columns={columns}
            rows={ledgerRows}
            getRowKey={(r) => r.id}
            emptyMessage="No SRP transactions recorded yet."
          />
          </QueryState>
        </Panel>
      </PageBody>
    </>
  )
}
