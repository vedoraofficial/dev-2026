import { History, IndianRupee, Package, TrendingUp, Wallet } from "lucide-react"
import { useRef, useState } from "react"

import { DataTable } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/routes"
import { MyWithdrawalsPanel, WithdrawPanel } from "@/features/wallet/components/withdraw-panel"
import {
  useCommissionIncome,
  useWalletSummary,
  useWalletTransactions,
} from "@/features/wallet/queries"
import { isAdminProductCommission, walletTxnColumns } from "@/features/wallet/transaction-columns"
import type { TransactionType } from "@/features/wallet/types"
import { startOfMonth } from "@/lib/date"
import { formatINR, formatNumber } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

const PAGE_SIZE = 15

/** Admin earns ₹200 for every product unit sold through the system. */
const ADMIN_COMMISSION_PER_UNIT = 200

/**
 * [Admin] The Admin's own wallet: balance, the ₹200-per-product commission, full history and
 * withdrawals to the Admin's verified bank (approved like any other request under Withdrawals).
 */
export function AdminWalletPage() {
  const [tab, setTab] = useState<"all" | TransactionType>("all")
  const [page, setPage] = useState(1)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const summary = useWalletSummary()
  const thisMonth = useCommissionIncome({ fromDate: startOfMonth() })
  const transactions = useWalletTransactions({
    type: tab === "all" ? undefined : tab,
    page,
    limit: PAGE_SIZE,
  })

  const monthCredits = (thisMonth.data?.commissions ?? []).filter(isAdminProductCommission)
  const monthCommission = paiseToRupees(monthCredits.reduce((sum, t) => sum + Number(t.amount), 0))
  const monthUnits = Math.round(monthCommission / ADMIN_COMMISSION_PER_UNIT)
  const pagination = transactions.data?.pagination

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle={`₹${ADMIN_COMMISSION_PER_UNIT} is credited automatically for every product sold`}
        actions={
          <Button
            onClick={() => {
              amountInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
              amountInputRef.current?.focus()
            }}
          >
            Request withdrawal
          </Button>
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard
            label="Available balance"
            icon={Wallet}
            value={summary.data ? formatINR(paiseToRupees(summary.data.availableBalance)) : "—"}
            hint={
              summary.data
                ? `${formatINR(paiseToRupees(summary.data.totalWithdrawn))} withdrawn`
                : undefined
            }
          />
          <StatCard
            label="Total earned"
            icon={TrendingUp}
            value={summary.data ? formatINR(paiseToRupees(summary.data.totalEarned)) : "—"}
            hint="All commissions credited so far"
          />
          <StatCard
            label="Product commission · this month"
            icon={IndianRupee}
            value={thisMonth.data ? formatINR(monthCommission) : "—"}
            hint={`₹${ADMIN_COMMISSION_PER_UNIT} per product sold`}
          />
          <StatCard
            label="Products sold · this month"
            icon={Package}
            value={thisMonth.data ? formatNumber(monthUnits) : "—"}
            hint={thisMonth.data ? `${formatNumber(monthCredits.length)} paid orders` : undefined}
          />
        </StatGrid>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              title="Transaction history"
              icon={History}
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
                />
              }
            />
            <QueryState query={transactions}>
              <DataTable
                columns={walletTxnColumns}
                rows={transactions.data?.items ?? []}
                getRowKey={(r) => r.id}
                emptyMessage="No transactions yet — the ₹200 commission appears here once a product is sold."
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

          <div className="space-y-4 md:space-y-5">
            <WithdrawPanel manageBanksHref={ROUTES.admin.profile} amountInputRef={amountInputRef} />
            <MyWithdrawalsPanel />
          </div>
        </div>
      </PageBody>
    </>
  )
}
