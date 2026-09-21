import { useState } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { Timeline } from "@/components/common/timeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  payoutTimeline,
  walletSummary,
  walletTransactions,
  type WalletTxn,
  type WalletTxnStatus,
} from "@/features/wallet/mock-data"
import { formatINR, formatNumber, formatSignedINR } from "@/lib/format"
import { cn } from "@/lib/utils"

const statusPill: Record<WalletTxnStatus, { label: string; variant: PillVariant }> = {
  success: { label: "Success", variant: "success" },
  pending: { label: "Pending", variant: "pending" },
  failed: { label: "Failed", variant: "danger" },
}

const columns: Column<WalletTxn>[] = [
  {
    key: "description",
    header: "Description",
    primary: true,
    cell: (r) => (
      <div>
        <p className="text-[0.875rem] font-medium">{r.title}</p>
        <p className="text-[0.6875rem] text-muted-foreground">{r.when}</p>
      </div>
    ),
  },
  { key: "source", header: "Source ID", cell: (r) => <MonoId tone="muted">{r.source}</MonoId> },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <StatusPill variant={statusPill[r.status].variant}>{statusPill[r.status].label}</StatusPill>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => (
      <span
        className={cn(
          "font-mono",
          r.status === "failed"
            ? "text-muted-foreground"
            : r.amount > 0
              ? "text-success"
              : "text-gold-light",
        )}
      >
        {formatSignedINR(r.amount)}
      </span>
    ),
  },
]

const quickAmounts = [5000, 10000, walletSummary.balance]

export function PartnerWalletPage() {
  const [tab, setTab] = useState("all")
  const [amount, setAmount] = useState("25000")

  const rows = walletTransactions.filter((t) =>
    tab === "credit" ? t.amount > 0 : tab === "debit" ? t.amount < 0 : true,
  )

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="Every credit is posted automatically by the commission engine"
        actions={
          <>
            <Button variant="outline">Add funds</Button>
            <Button>Request withdrawal</Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <Panel className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 md:p-6">
              <div>
                <p className="eyebrow text-gold">Available balance</p>
                <p className="mt-2 font-display text-5xl leading-none md:text-6xl">
                  {formatINR(walletSummary.balance)}
                </p>
                <p className="mt-3 text-[0.6875rem] text-muted-foreground">
                  <MonoId tone="muted" className="text-[0.6875rem]">
                    {walletSummary.partnerId}
                  </MonoId>{" "}
                  · <span className="font-mono">{walletSummary.bank}</span>
                </p>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="eyebrow text-[0.625rem]">Pending payout</p>
                  <p className="mt-1 font-display text-2xl text-gold-light">
                    {formatINR(walletSummary.pendingPayout)}
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-[0.625rem]">Withdrawn</p>
                  <p className="mt-1 font-display text-2xl">{formatINR(walletSummary.withdrawn)}</p>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Transaction history"
                aside={
                  <FilterTabs
                    aria-label="Transaction type"
                    value={tab}
                    onValueChange={setTab}
                    tabs={[
                      { value: "all", label: "All" },
                      { value: "credit", label: "Credit" },
                      { value: "debit", label: "Debit" },
                    ]}
                  />
                }
              />
              <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
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
                    inputMode="numeric"
                    value={amount ? formatNumber(Number(amount)) : ""}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    className="h-12 pl-8 font-mono text-lg md:h-12 md:text-lg"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((q, i) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(String(q))}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                    >
                      {i === quickAmounts.length - 1 ? "Max" : formatINR(q)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="eyebrow">Payout to</p>
                <div className="flex items-center justify-between rounded-xl border border-border bg-field px-3.5 py-3 text-[0.8125rem]">
                  <span>HDFC Bank ****4821</span>
                  <button type="button" className="text-xs font-medium text-gold hover:underline">
                    Change
                  </button>
                </div>
              </div>

              <p className="mt-4 rounded-xl border border-border bg-field/60 p-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
                Requests are reviewed by Admin and settled to your bank via Razorpay or PhonePe.
              </p>
              <Button size="lg" className="mt-4 w-full">
                Submit request
              </Button>
            </Panel>

            <Panel>
              <PanelHeader title="Payout timeline" />
              <Timeline steps={payoutTimeline} />
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
