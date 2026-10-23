import { useRef, useState } from "react"
import { Navigate, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { DataTable } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { TopupDialog } from "@/features/wallet/components/topup-dialog"
import { MyWithdrawalsPanel, WithdrawPanel } from "@/features/wallet/components/withdraw-panel"
import { useWalletSummary, useWalletTransactions } from "@/features/wallet/queries"
import { walletTxnColumns } from "@/features/wallet/transaction-columns"
import type { TransactionType } from "@/features/wallet/types"
import { formatINR, formatNumber } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"
import { useSession } from "@/lib/session"

const PAGE_SIZE = 10
export function PartnerWalletPage() {
  const [searchParams] = useSearchParams()
  const me = useSession((s) => s.user)
  const [tab, setTab] = useState<"all" | TransactionType>("all")
  const [page, setPage] = useState(1)
  const [topupOpen, setTopupOpen] = useState(false)
  const withdrawPanelRef = useRef<HTMLDivElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const summary = useWalletSummary()
  const transactions = useWalletTransactions({
    type: tab === "all" ? undefined : tab,
    page,
    limit: PAGE_SIZE,
  })

  const merchantOrderId = searchParams.get("merchantOrderId") || searchParams.get("orderId")
  if (merchantOrderId) {
    return <Navigate to={`${ROUTES.paymentStatus}?${searchParams.toString()}`} replace />
  }

  const balance = paiseToRupees(summary.data?.availableBalance)
  const pagination = transactions.data?.pagination

  const focusWithdrawPanel = () => {
    withdrawPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    amountInputRef.current?.focus()
  }

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="Every credit is posted automatically by the commission engine"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setTopupOpen(true)}>
              Add money
            </Button>
            <Button onClick={focusWithdrawPanel}>Request withdrawal</Button>
          </div>
        }
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
                  columns={walletTxnColumns}
                  rows={transactions.data?.items ?? []}
                  getRowKey={(r) => r.id}
                  emptyMessage="No transactions yet — commissions appear here once your team orders."
                />
                {pagination && pagination.totalPages > 1 ? (
                  <TablePagination
                    key={tab}
                    summary={`Page ${pagination.page} of ${pagination.totalPages} · ${formatNumber(pagination.total)} transactions`}
                    pages={pagination.totalPages}
                    page={page}
                    onPageChange={setPage}
                  />
                ) : null}
              </QueryState>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <div ref={withdrawPanelRef} />
            <WithdrawPanel
              manageBanksHref={ROUTES.partner.profile}
              amountInputRef={amountInputRef}
            />
            <MyWithdrawalsPanel />
          </div>
        </div>
      </PageBody>
      <TopupDialog open={topupOpen} onOpenChange={setTopupOpen} currentBalance={balance} />
    </>
  )
}
