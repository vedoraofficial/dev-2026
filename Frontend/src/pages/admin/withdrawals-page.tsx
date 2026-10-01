import { useState } from "react"
import { toast } from "sonner"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  withdrawalRequests as initialRequests,
  type WithdrawalRequest,
  type WithdrawalStatus,
} from "@/features/withdrawals/mock-data"
import { formatINR } from "@/lib/format"

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

function matchesQuery(r: WithdrawalRequest, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    r.id.toLowerCase().includes(q) ||
    r.partner.toLowerCase().includes(q) ||
    r.partnerId.toLowerCase().replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))
  )
}

export function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState(initialRequests)
  const [tab, setTab] = useState<WithdrawalStatus>("pending")
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const pendingTotal = requests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0)
  const tabCounts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }

  const rows = requests.filter((r) => r.status === tab && matchesQuery(r, query))
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))
  const someSelected = rows.some((r) => selectedIds.has(r.id))

  const setStatus = (id: string, status: WithdrawalStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelectedIds((prev) => {
      if (allSelected) {
        const next = new Set(prev)
        rows.forEach((r) => next.delete(r.id))
        return next
      }
      return new Set([...prev, ...rows.map((r) => r.id)])
    })

  const bulkAction = (status: "approved" | "rejected") => {
    const ids = rows.filter((r) => selectedIds.has(r.id)).map((r) => r.id)
    setRequests((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status } : r)))
    setSelectedIds(new Set())
    toast.success(`${ids.length} request${ids.length === 1 ? "" : "s"} ${status}`)
  }

  const selectColumn: Column<WithdrawalRequest> = {
    key: "select",
    header: "Select",
    cell: (r) => (
      <Checkbox
        checked={selectedIds.has(r.id)}
        onCheckedChange={() => toggleOne(r.id)}
        aria-label={`Select ${r.id}`}
      />
    ),
  }

  const columns: Column<WithdrawalRequest>[] = [
    ...(tab === "pending" ? [selectColumn] : []),
    {
      key: "request",
      header: "Request",
      primary: true,
      cell: (r) => (
        <MonoId tone="gold" className="text-[0.8125rem]">
          {r.id}
        </MonoId>
      ),
    },
    {
      key: "partner",
      header: "Partner",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.partner}</p>
          <MonoId tone="muted" className="text-[0.6875rem]">
            {r.partnerId}
          </MonoId>
        </div>
      ),
    },
    {
      key: "bank",
      header: "Bank",
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.bank}</span>,
    },
    {
      key: "wallet",
      header: "Wallet bal.",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatINR(r.walletBalance)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (r) => <span className="font-mono font-medium">{formatINR(r.amount)}</span>,
    },
    {
      key: "actions",
      header: "Action",
      actions: true,
      cell: (r) =>
        r.status === "pending" ? (
          <>
            <Button
              size="sm"
              onClick={() => {
                setStatus(r.id, "approved")
                toast.success(`${r.id} approved`)
              }}
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setStatus(r.id, "rejected")
                toast.success(`${r.id} rejected`)
              }}
            >
              Reject
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground capitalize">{r.status}</span>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Withdrawal Requests"
        subtitle={`${tabCounts.pending} pending · ${formatINR(pendingTotal)} awaiting approval`}
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
        <StatGrid cols={5} className="[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
          <StatCard label="Total partners" value="6,482" />
          <StatCard label="Joined today" value="64" />
          <StatCard label="BV this month" value="18.4L" />
          <StatCard label="Commission paid" value="₹11.0L" />
          <StatCard label="Pending payouts" value={formatINR(pendingTotal)} />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Withdrawal status"
              tabs={TABS.map((t) => ({
                ...t,
                label: `${t.label} ${tabCounts[t.value as WithdrawalStatus]}`,
              }))}
              value={tab}
              onValueChange={(v) => setTab(v as WithdrawalStatus)}
            />
            <div className="flex items-center gap-3">
              <FilterSelect label="Gateway" options={["PhonePe"]} />
              {tab === "pending" ? (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={someSelected && !allSelected ? "indeterminate" : allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all pending requests"
                  />
                  Select all
                </label>
              ) : null}
            </div>
          </div>

          {tab === "pending" && selectedIds.size > 0 ? (
            <div className="mb-3 flex items-center justify-end gap-2 border-b border-border/70 pb-3">
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              <Button size="sm" onClick={() => bulkAction("approved")}>
                Approve selected
              </Button>
              <Button variant="destructive" size="sm" onClick={() => bulkAction("rejected")}>
                Reject selected
              </Button>
            </div>
          ) : null}

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
            summary={`Showing ${rows.length} of ${tabCounts[tab]} ${tab} request${tabCounts[tab] === 1 ? "" : "s"}`}
            pages={1}
          />
        </Panel>
      </PageBody>
    </>
  )
}
