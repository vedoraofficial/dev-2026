import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { approveWithdrawal, rejectWithdrawal } from "@/features/wallet/api"
import { RejectWithdrawalDialog } from "@/features/wallet/components/reject-withdrawal-dialog"
import { maskedBank, withdrawalPill } from "@/features/wallet/labels"
import {
  useAllWithdrawals,
  useApproveWithdrawal,
  useRejectWithdrawal,
  walletKeys,
} from "@/features/wallet/queries"
import type { AdminWithdrawal } from "@/features/wallet/types"
import { apiErrorMessage } from "@/lib/api"
import { formatDateTime } from "@/lib/date"
import { formatINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"

type Tab = "PENDING" | "APPROVED" | "REJECTED"
const TABS: { value: Tab; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

const wdNo = (id: number) => `WD-${String(id).padStart(5, "0")}`
const sum = (list: AdminWithdrawal[]) => list.reduce((s, w) => s + paiseToRupees(w.amount), 0)

function matchesQuery(r: AdminWithdrawal, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/\s+/g, "")
  if (!q) return true
  return (
    wdNo(r.id).toLowerCase().includes(q) ||
    r.user.name.toLowerCase().replace(/\s+/g, "").includes(q) ||
    r.user.vedId.toLowerCase().includes(q)
  )
}

export function AdminWithdrawalsPage() {
  const withdrawals = useAllWithdrawals()
  const approve = useApproveWithdrawal()
  const reject = useRejectWithdrawal()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>("PENDING")
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const all = withdrawals.data ?? []
  const byStatus = (s: Tab) => all.filter((w) => w.status === s)
  const pending = byStatus("PENDING")
  const rows = byStatus(tab).filter((r) => matchesQuery(r, query))
  const selectedRows = rows.filter((r) => selectedIds.has(r.id))
  const allSelected = rows.length > 0 && selectedRows.length === rows.length

  const toggleOne = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)))

  /** One request at a time — the backend has no bulk endpoint. */
  const bulk = async (action: "approve" | "reject", remarks?: string) => {
    setBulkBusy(true)
    let done = 0
    for (const r of selectedRows) {
      try {
        if (action === "approve") await approveWithdrawal(r.id)
        else await rejectWithdrawal({ id: r.id, remarks })
        done++
      } catch (error) {
        toast.error(`${wdNo(r.id)}: ${apiErrorMessage(error)}`)
      }
    }
    await queryClient.invalidateQueries({ queryKey: walletKeys.all })
    setSelectedIds(new Set())
    setBulkBusy(false)
    if (done) toast.success(`${done} request${done === 1 ? "" : "s"} ${action}d`)
  }

  const selectColumn: Column<AdminWithdrawal> = {
    key: "select",
    header: "Select",
    cell: (r) => (
      <Checkbox
        checked={selectedIds.has(r.id)}
        onCheckedChange={() => toggleOne(r.id)}
        aria-label={`Select ${wdNo(r.id)}`}
      />
    ),
  }

  const columns: Column<AdminWithdrawal>[] = [
    ...(tab === "PENDING" ? [selectColumn] : []),
    {
      key: "request",
      header: "Request",
      primary: true,
      cell: (r) => (
        <div>
          <MonoId tone="gold" className="text-[0.8125rem]">
            {wdNo(r.id)}
          </MonoId>
          <p className="text-[0.6875rem] text-muted-foreground">{formatDateTime(r.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "partner",
      header: "Partner",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.user.name}</p>
          <MonoId tone="muted" className="text-[0.6875rem]">
            {r.user.vedId}
          </MonoId>
        </div>
      ),
    },
    {
      key: "bank",
      header: "Bank",
      cell: (r) => (
        <div className="font-mono text-xs text-muted-foreground">
          <p>{maskedBank(r.bank)}</p>
          <p>{r.bank?.ifscCode}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (r) => (
        <span className="font-mono font-medium">{formatINR(paiseToRupees(r.amount))}</span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      actions: true,
      cell: (r) =>
        r.status === "PENDING" ? (
          <>
            <ConfirmDialog
              trigger={
                <Button size="sm" disabled={approve.isPending || bulkBusy}>
                  Approve
                </Button>
              }
              title={`Approve ${wdNo(r.id)}?`}
              description={`${formatINR(paiseToRupees(r.amount))} to ${r.user.name} (${maskedBank(r.bank)}).`}
              confirmLabel="Approve"
              onConfirm={() => approve.mutate(r.id)}
            />
            <RejectWithdrawalDialog
              trigger={
                <Button variant="destructive" size="sm" disabled={reject.isPending || bulkBusy}>
                  Reject
                </Button>
              }
              what={wdNo(r.id)}
              busy={reject.isPending}
              onReject={(remarks) => reject.mutate({ id: r.id, remarks: remarks || undefined })}
            />
          </>
        ) : (
          <div className="md:text-right">
            <StatusPill variant={withdrawalPill[r.status].variant}>
              {withdrawalPill[r.status].label}
            </StatusPill>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">
              {r.adminRemarks ?? (r.adminUser ? `by ${r.adminUser.vedId}` : "")}
            </p>
          </div>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Withdrawal Requests"
        subtitle={`${pending.length} pending · ${formatINR(sum(pending))} awaiting approval`}
        actions={
          <Input
            type="search"
            placeholder="Search request or ID…"
            aria-label="Search withdrawals"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-64"
          />
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard
            label="Pending requests"
            value={pending.length}
            onClick={() => setTab("PENDING")}
          />
          <StatCard label="Pending payouts" value={formatINR(sum(pending))} />
          <StatCard
            label="Approved"
            value={formatINR(sum(byStatus("APPROVED")))}
            hint={`${byStatus("APPROVED").length} requests`}
            onClick={() => setTab("APPROVED")}
          />
          <StatCard
            label="Rejected"
            value={byStatus("REJECTED").length}
            onClick={() => setTab("REJECTED")}
          />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Withdrawal status"
              tabs={TABS.map((t) => ({ ...t, label: `${t.label} ${byStatus(t.value).length}` }))}
              value={tab}
              onValueChange={(v) => {
                setTab(v as Tab)
                setSelectedIds(new Set())
              }}
            />
            {tab === "PENDING" ? (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={selectedRows.length > 0 && !allSelected ? "indeterminate" : allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all pending requests"
                />
                Select all
              </label>
            ) : null}
          </div>

          {tab === "PENDING" && selectedRows.length > 0 ? (
            <div className="mb-3 flex items-center justify-end gap-2 border-b border-border/70 pb-3">
              <span className="text-xs text-muted-foreground">{selectedRows.length} selected</span>
              <ConfirmDialog
                trigger={
                  <Button size="sm" disabled={bulkBusy}>
                    Approve selected
                  </Button>
                }
                title={`Approve ${selectedRows.length} requests?`}
                description={`${formatINR(sum(selectedRows))} in total.`}
                confirmLabel="Approve all"
                onConfirm={() => void bulk("approve")}
              />
              <RejectWithdrawalDialog
                trigger={
                  <Button variant="destructive" size="sm" disabled={bulkBusy}>
                    Reject selected
                  </Button>
                }
                what={`${selectedRows.length} requests`}
                busy={bulkBusy}
                onReject={(remarks) => void bulk("reject", remarks || undefined)}
              />
            </div>
          ) : null}

          <QueryState query={withdrawals} rows={5}>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(r) => r.id}
              emptyMessage={
                query.trim() ? `No requests match "${query.trim()}".` : "No requests here."
              }
            />
            <TablePagination
              key={tab}
              summary={`Showing ${rows.length} of ${byStatus(tab).length} ${tab.toLowerCase()} request${byStatus(tab).length === 1 ? "" : "s"}`}
              pages={1}
            />
          </QueryState>
        </Panel>
      </PageBody>
    </>
  )
}
