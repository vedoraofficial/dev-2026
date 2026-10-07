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
import { useMyDownline } from "@/features/genealogy/use-network"
import { downloadCsv } from "@/lib/csv"
import { formatDate } from "@/lib/date"
import { formatNumber } from "@/lib/format"

/** One partner in my team, any level. */
type TeamRow = {
  vedId: string
  name: string
  email: string
  mobile: string
  level: number
  slot: number
  /** VEDORA ID of the partner they sit under */
  under: string
  /** Only known for Level 1 (from my-slots) */
  joinedAt: string | null
  /** Account status for Level 1, placement status deeper down */
  status: string
}

const statusPill: Record<string, { label: string; variant: PillVariant }> = {
  ACTIVE: { label: "Active", variant: "success" },
  PENDING: { label: "Pending", variant: "pending" },
  INACTIVE: { label: "Inactive", variant: "neutral" },
  BLOCKED: { label: "Blocked", variant: "danger" },
  SUSPENDED: { label: "Suspended", variant: "danger" },
}
const pill = (status: string) => statusPill[status] ?? { label: status, variant: "neutral" }

const LEVELS = [1, 2, 3, 4, 5]
const STATUS_OPTIONS = ["All", "Active", "Pending", "Inactive", "Blocked", "Suspended"]
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

export function PartnerTeamPage() {
  const slots = useMySlots()
  const downline = useMyDownline()
  const [level, setLevel] = useState("1")
  const [status, setStatus] = useState("All")
  const [query, setQuery] = useState("")
  const isSearching = query.trim().length > 0
  const levelNo = Number(level)

  // Level 1 from my-slots (has joining dates); Levels 2–5 from walking each team's genealogy.
  const direct: TeamRow[] = (slots.data?.filledSlots ?? []).map((f) => ({
    vedId: f.partner.vedId,
    name: f.partner.name,
    email: f.partner.email,
    mobile: f.partner.mobile,
    level: 1,
    slot: f.slotNumber,
    under: slots.data?.sponsor.vedId ?? "",
    joinedAt: f.partner.joinedAt,
    status: f.partner.status,
  }))
  const deeper: TeamRow[] = (downline.data ?? [])
    .filter((m) => m.level >= 2)
    .map((m) => ({
      vedId: m.vedId,
      name: m.name,
      email: m.email,
      mobile: m.mobile,
      level: m.level,
      slot: m.slot,
      under: m.sponsor,
      joinedAt: null,
      status: m.status,
    }))
  const everyone = [...direct, ...deeper]
  const nameOf = new Map(everyone.map((m) => [m.vedId, m.name]))

  const levelQuery = levelNo === 1 ? slots : downline
  const rows = everyone.filter(
    (m) =>
      m.level === levelNo &&
      (status === "All" || pill(m.status).label === status) &&
      matchesQuery(m, query),
  )

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
      key: "under",
      header: "Under",
      cell: (r) =>
        r.level === 1 ? (
          <span className="text-muted-foreground">You</span>
        ) : (
          <div className="text-[0.75rem]">
            <p>{nameOf.get(r.under) ?? "—"}</p>
            <MonoId tone="muted" className="text-[0.6875rem]">
              {r.under}
            </MonoId>
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
      cell: (r) => <StatusPill variant={pill(r.status).variant}>{pill(r.status).label}</StatusPill>,
    },
  ]

  const exportCsv = () => {
    downloadCsv(
      `vedora-my-team-level${level}${status === "All" ? "" : `-${status.toLowerCase()}`}.csv`,
      ["VEDORA ID", "Name", "Mobile", "Email", "Level", "Under", "Joined", "Slot", "Status"],
      rows.map((r) => [
        r.vedId,
        r.name,
        r.mobile,
        r.email,
        r.level,
        r.level === 1 ? "You" : r.under,
        formatDate(r.joinedAt),
        r.slot,
        pill(r.status).label,
      ]),
    )
  }

  const filled = slots.data?.totalFilled ?? 0
  const max = slots.data?.maxSlots ?? 20
  const countAt = (l: number) => deeper.filter((m) => m.level === l).length
  const teamSize = direct.length + deeper.length

  return (
    <>
      <PageHeader
        title="My Team"
        subtitle={
          downline.data
            ? `${formatNumber(teamSize)} partners across 5 levels · ${filled} of ${max} direct slots used`
            : `${filled} of ${max} direct slots used`
        }
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
          {LEVELS.map((l) => (
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
                ) : downline.data ? (
                  formatNumber(countAt(l))
                ) : (
                  <span className="text-muted-foreground">…</span>
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
              tabs={LEVELS.map((n) => ({ value: String(n), label: `Level ${n}` }))}
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
          <QueryState query={levelQuery} rows={5}>
            <DataTable
              columns={columns}
              rows={pagedRows}
              getRowKey={(r) => r.vedId}
              emptyMessage={
                isSearching
                  ? `No partners match "${query.trim()}".`
                  : levelNo === 1
                    ? "No direct partners yet — register your first partner."
                    : `No partners at Level ${level} yet.`
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
