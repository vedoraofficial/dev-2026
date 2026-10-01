import { useState } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { PersonAvatar } from "@/components/common/person-avatar"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMySlots } from "@/features/genealogy/queries"
import type { MySlots } from "@/features/genealogy/types"
import { downloadCsv } from "@/lib/csv"
import { formatDate } from "@/lib/date"
import type { UserStatus } from "@/types/user"

type TeamRow = MySlots["filledSlots"][number]["partner"] & { slot: number }

const statusPill: Record<UserStatus, { label: string; variant: PillVariant }> = {
  ACTIVE: { label: "Active", variant: "success" },
  PENDING: { label: "Pending", variant: "pending" },
  INACTIVE: { label: "Inactive", variant: "neutral" },
  BLOCKED: { label: "Blocked", variant: "danger" },
}

const STATUS_OPTIONS = ["All", "Active", "Pending", "Inactive", "Blocked"]
const PAGE_SIZE = 10

function matchesQuery(m: TeamRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const qDigits = q.replace(/\s+/g, "")
  return (
    m.name.toLowerCase().includes(q) ||
    m.vedId.toLowerCase().includes(qDigits) ||
    m.mobile.includes(qDigits) ||
    m.email.toLowerCase().includes(q)
  )
}

const columns: Column<TeamRow>[] = [
  {
    key: "partner",
    header: "Partner",
    primary: true,
    cell: (r) => (
      <div className="flex items-center gap-3">
        <PersonAvatar size="sm" tone={r.status === "ACTIVE" ? "striped" : "muted"} />
        <div className="min-w-0">
          <p className="truncate text-[0.875rem] font-medium">{r.name}</p>
          <MonoId tone="muted" className="text-[0.6875rem]">
            {r.vedId}
          </MonoId>
        </div>
      </div>
    ),
  },
  {
    key: "contact",
    header: "Contact",
    cell: (r) => (
      <div className="text-[0.75rem]">
        <p className="font-mono">{r.mobile}</p>
        <p className="text-muted-foreground">{r.email}</p>
      </div>
    ),
  },
  {
    key: "joined",
    header: "Joined",
    cell: (r) => <span className="text-muted-foreground">{formatDate(r.joinedAt)}</span>,
  },
  {
    key: "slot",
    header: "Slot",
    cell: (r) => (
      <MonoId className="text-[0.8125rem] text-gold">{String(r.slot).padStart(2, "0")}</MonoId>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "right",
    cell: (r) => (
      <StatusPill variant={statusPill[r.status].variant}>{statusPill[r.status].label}</StatusPill>
    ),
  },
]

export function PartnerTeamPage() {
  const slots = useMySlots()
  const [level, setLevel] = useState("1")
  const [status, setStatus] = useState("All")
  const [query, setQuery] = useState("")
  const isSearching = query.trim().length > 0

  const direct: TeamRow[] = (slots.data?.filledSlots ?? []).map((f) => ({
    ...f.partner,
    slot: f.slotNumber,
  }))
  // Only Level 1 comes from the server (GET /api/partner/my-slots); deeper levels have no API yet.
  const rows =
    level === "1"
      ? direct.filter(
          (m) =>
            (status === "All" || statusPill[m.status].label === status) && matchesQuery(m, query),
        )
      : []

  const filterKey = `${level}|${status}|${query}`
  const [page, setPage] = useState(1)
  const [syncedFilterKey, setSyncedFilterKey] = useState(filterKey)
  if (filterKey !== syncedFilterKey) {
    setSyncedFilterKey(filterKey)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, rows.length)

  const exportCsv = () => {
    downloadCsv(
      `vedora-my-team-level${level}${status === "All" ? "" : `-${status.toLowerCase()}`}.csv`,
      ["VEDORA ID", "Name", "Mobile", "Email", "Joined", "Slot", "Status"],
      rows.map((r) => [
        r.vedId,
        r.name,
        r.mobile,
        r.email,
        formatDate(r.joinedAt),
        r.slot,
        statusPill[r.status].label,
      ]),
    )
  }

  const filled = slots.data?.totalFilled ?? 0
  const max = slots.data?.maxSlots ?? 20

  return (
    <>
      <PageHeader
        title="My Team"
        subtitle={`${filled} of ${max} direct slots used`}
        actions={
          <>
            <Input
              type="search"
              placeholder="Search name, ID, mobile…"
              aria-label="Search team"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-72"
            />
            <Button asChild className="max-md:flex-1">
              <Link to={ROUTES.partner.manualPlacement}>Register partner</Link>
            </Button>
          </>
        }
      />
      <PageBody>
        <StatGrid cols={5} className="[&>*:first-child]:col-span-2 lg:[&>*:first-child]:col-span-1">
          {[1, 2, 3, 4, 5].map((l) => (
            <StatCard
              key={l}
              highlight={String(l) === level}
              label={l === 1 ? "Level 1 · Direct" : `Level ${l}`}
              value={
                l === 1 ? (
                  <>
                    {filled}
                    <span className="text-base text-muted-foreground"> / {max}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
              onClick={() => setLevel(String(l))}
            />
          ))}
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Team level"
              value={level}
              onValueChange={setLevel}
              tabs={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Level ${n}` }))}
            />
            <div className="flex items-center gap-2">
              <FilterSelect
                label="Status"
                options={STATUS_OPTIONS}
                defaultValue={status}
                onValueChange={setStatus}
              />
              <Button
                variant="outline"
                className="h-10 md:h-9"
                disabled={rows.length === 0}
                onClick={exportCsv}
              >
                Export
              </Button>
            </div>
          </div>
          <QueryState query={slots} rows={5}>
            <DataTable
              columns={columns}
              rows={pagedRows}
              getRowKey={(r) => r.vedId}
              emptyMessage={
                level !== "1"
                  ? `Level ${level} isn't available from the server yet.`
                  : isSearching
                    ? `No partners match "${query.trim()}".`
                    : "No direct partners yet — register your first partner."
              }
            />
            <TablePagination
              key={filterKey}
              summary={
                rows.length === 0
                  ? "No partners to show"
                  : `Showing ${rangeStart}–${rangeEnd} of ${rows.length} partner${rows.length === 1 ? "" : "s"}`
              }
              pages={totalPages}
              onPageChange={setPage}
            />
          </QueryState>
        </Panel>
      </PageBody>
    </>
  )
}
