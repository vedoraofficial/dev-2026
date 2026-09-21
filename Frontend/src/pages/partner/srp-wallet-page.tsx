import { DataTable, type Column } from "@/components/common/data-table"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { ProgressBar } from "@/components/common/progress-bar"
import { activationTimeline, srpLedger, srpWallet } from "@/features/wallet/mock-data"
import { cn } from "@/lib/utils"

type LedgerRow = (typeof srpLedger)[number]

const columns: Column<LedgerRow>[] = [
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
  return (
    <>
      <PageHeader title="SRP Wallet" subtitle="Sales Reward Points · 2 SRP per confirmed sale" />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel className="md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <p className="eyebrow text-gold">SRP balance</p>
                <p className="mt-2 font-display text-5xl leading-none md:text-6xl">
                  {srpWallet.balance} <span className="text-2xl text-muted-foreground">SRP</span>
                </p>
              </div>
              <div className="sm:text-right">
                <p className="eyebrow text-[0.625rem]">Redeemable for</p>
                <p className="mt-1 font-display text-2xl text-success">2 months free activation</p>
              </div>
            </div>

            <ProgressBar
              value={srpWallet.balance}
              max={srpWallet.max}
              label="SRP progress towards 50"
              className="mt-6 h-2.5"
            />

            <div className="mt-5 grid grid-cols-5 gap-2">
              {srpWallet.tiers.map((t) => {
                const reached = srpWallet.balance >= t.points
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
                    <p className="mt-0.5 text-[0.5625rem] sm:text-[0.625rem]">{t.label}</p>
                  </div>
                )
              })}
            </div>

            <p className="mt-5 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground">
              Earn <strong className="font-semibold text-gold">2 SRP</strong> for every confirmed
              bracelet sale. If you make no sale in a month and hold 10 SRP or more, the system
              deducts 10 SRP automatically and keeps your ID active for the next month.
            </p>
          </Panel>

          <Panel>
            <PanelHeader title="Activation timeline" />
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
                  {m.tone === "neutral" ? (
                    <span className="text-xs text-muted-foreground">{m.status}</span>
                  ) : (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        m.tone === "success" ? "text-success" : "text-warning",
                      )}
                    >
                      {m.status}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel>
          <PanelHeader
            title="SRP ledger"
            aside={
              <span className="font-mono text-gold">
                +{srpWallet.earned} earned · -{srpWallet.redeemed} redeemed
              </span>
            }
          />
          <DataTable columns={columns} rows={srpLedger} getRowKey={(r) => r.id} />
        </Panel>
      </PageBody>
    </>
  )
}
