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
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { partnerTree } from "@/features/genealogy/mock-data"
import {
  levelCounts,
  teamMembers,
  type TeamMember,
  type TeamMemberStatus,
} from "@/features/team/mock-data"
import { downloadCsv } from "@/lib/csv"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const statusPill: Record<TeamMemberStatus, { label: string; variant: PillVariant }> = {
  active: { label: "Active", variant: "success" },
  "free-active": { label: "Free Active", variant: "pending" },
  "no-bv": { label: "No BV", variant: "danger" },
}

const STATUS_OPTIONS = ["All", "Active", "Free Active", "No BV"]
const PAGE_SIZE = 10

function matchesQuery(m: TeamMember, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const qDigits = q.replace(/\s+/g, "")
  return (
    m.name.toLowerCase().includes(q) || m.id.toLowerCase().replace(/\s+/g, "").includes(qDigits)
  )
}

function matchesStatus(m: TeamMember, status: string): boolean {
  return status === "All" || statusPill[m.status].label === status
}

export function PartnerTeamPage() {
  const [level, setLevel] = useState("1")
  const [status, setStatus] = useState("All")
  const [query, setQuery] = useState("")
  const isSearching = query.trim().length > 0

  const rows = teamMembers.filter(
    (m) => String(m.level) === level && matchesStatus(m, status) && matchesQuery(m, query),
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

  const columns: Column<TeamMember>[] = [
    {
      key: "partner",
      header: "Partner",
      primary: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <PersonAvatar size="sm" tone={r.status === "no-bv" ? "muted" : "striped"} />
          <div className="min-w-0">
            <p className="truncate text-[0.875rem] font-medium">{r.name}</p>
            <MonoId tone="muted" className="text-[0.6875rem]">
              {r.id}
            </MonoId>
          </div>
        </div>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      cell: (r) => <span className="text-muted-foreground">{r.joined}</span>,
    },
    {
      key: "slot",
      header: "Slot",
      cell: (r) => (
        <MonoId className={cn("text-[0.8125rem]", r.slot > 20 ? "text-danger" : "text-gold")}>
          {String(r.slot).padStart(2, "0")}
        </MonoId>
      ),
    },
    {
      key: "downline",
      header: "Own downline",
      cell: (r) => <span className="text-muted-foreground">{r.downline} partners</span>,
    },
    {
      key: "srp",
      header: "SRP",
      cell: (r) => <span className="font-mono text-xs text-gold-light">{r.srp} SRP</span>,
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

  const exportCsv = () => {
    downloadCsv(
      `vedora-my-team-level${level}${status === "All" ? "" : `-${status.toLowerCase().replace(" ", "")}`}.csv`,
      ["VEDORA ID", "Name", "Level", "Joined", "Slot", "Own downline", "SRP", "Status"],
      rows.map((r) => [
        r.id,
        r.name,
        r.level,
        r.joined,
        r.slot,
        r.downline,
        r.srp,
        statusPill[r.status].label,
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="My Team"
        subtitle={`${formatNumber(partnerTree.downline)} partners across 5 levels · ${partnerTree.direct} of 20 direct slots used`}
        actions={
          <>
            <Input
              type="search"
              placeholder="Search name or VEDORA ID…"
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
          {levelCounts.map((l) => (
            <StatCard
              key={l.level}
              highlight={String(l.level) === level}
              label={l.level === 1 ? "Level 1 · Direct" : `Level ${l.level}`}
              value={
                <>
                  {l.count}
                  {l.cap ? (
                    <span className="text-base text-muted-foreground"> / {l.cap}</span>
                  ) : null}
                </>
              }
              onClick={() => setLevel(String(l.level))}
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
          <DataTable
            columns={columns}
            rows={pagedRows}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (r.status === "no-bv" ? "bg-muted/30" : undefined)}
            emptyMessage={
              isSearching ? `No partners match "${query.trim()}".` : "No partners at this level."
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
        </Panel>
      </PageBody>
    </>
  )
}
