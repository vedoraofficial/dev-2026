import { useMemo, useState } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Panel } from "@/components/common/panel"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  partnerTabs,
  partners,
  type PartnerRow,
  type PartnerStatus,
} from "@/features/partners/mock-data"
import { downloadCsv } from "@/lib/csv"
import { formatCompactINR, formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const statusLabel: Record<PartnerStatus, { text: string; variant: PillVariant }> = {
  active: { text: "Active", variant: "success" },
  "free-active": { text: "Free Active", variant: "gold" },
  "pan-pending": { text: "PAN pending", variant: "pending" },
  inactive: { text: "Inactive", variant: "danger" },
}

const LEVEL_OPTIONS = ["Any", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]

/** Which tab each partner belongs to. "all" and "founders" aren't PartnerStatus values. */
function matchesTab(partner: PartnerRow, tab: string): boolean {
  if (tab === "all") return true
  if (tab === "founders") return !!partner.founder
  return partner.status === tab
}

/** Matches the search box against ID, name and mobile (spaces ignored for ID/mobile). */
function matchesQuery(partner: PartnerRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const qDigits = q.replace(/\s+/g, "")
  return (
    partner.name.toLowerCase().includes(q) ||
    partner.id.toLowerCase().replace(/\s+/g, "").includes(qDigits) ||
    partner.mobile.replace(/\s+/g, "").includes(qDigits)
  )
}

/** "Any" matches everyone; "Level 3" matches partner.level === 3. */
function matchesLevel(partner: PartnerRow, level: string): boolean {
  return level === "Any" || partner.level === Number(level.replace("Level ", ""))
}

function RowActions({ row }: { row: PartnerRow }) {
  return (
    <>
      <Button variant="quiet" size="sm">
        View
      </Button>
      {row.founder ? (
        <Button variant="quiet" size="sm" disabled>
          Locked
        </Button>
      ) : row.status === "pan-pending" ? (
        <Button size="sm">Review</Button>
      ) : row.status === "inactive" ? (
        <Button variant="outline" size="sm">
          Activate
        </Button>
      ) : (
        <Button variant="outline" size="sm">
          Edit
        </Button>
      )}
    </>
  )
}

const columns: Column<PartnerRow>[] = [
  {
    key: "partner",
    header: "Partner",
    primary: true,
    cell: (r) => (
      <div className="flex items-center gap-3">
        <PersonAvatar tone={r.founder ? "gold" : r.status === "inactive" ? "muted" : "plain"} />
        <div className="min-w-0">
          <p className="truncate text-[0.875rem] font-medium">{r.name}</p>
          <p className="text-[0.6875rem]">
            <MonoId tone={r.founder ? "gold" : "muted"}>{r.id}</MonoId>
            {r.founder ? <span className="text-gold"> · Founder</span> : null}
          </p>
        </div>
      </div>
    ),
  },
  { key: "sponsor", header: "Sponsor", cell: (r) => <MonoId tone="muted">{r.sponsor}</MonoId> },
  {
    key: "level",
    header: "Level",
    cell: (r) => <span className="text-muted-foreground">L{r.level}</span>,
  },
  {
    key: "slots",
    header: "Slots",
    cell: (r) => (
      <MonoId
        className={cn("text-[0.8125rem]", r.slotsUsed === 20 ? "text-danger" : "text-foreground")}
      >
        {String(r.slotsUsed).padStart(2, "0")} / 20
      </MonoId>
    ),
  },
  {
    key: "team",
    header: "Team",
    cell: (r) => <span className="text-muted-foreground">{formatNumber(r.team)}</span>,
  },
  {
    key: "wallet",
    header: "Wallet",
    cell: (r) => (
      <span className="font-mono text-[0.8125rem]">
        {r.wallet >= 100000 ? formatCompactINR(r.wallet) : formatINR(r.wallet)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <StatusPill variant={statusLabel[r.status].variant}>{statusLabel[r.status].text}</StatusPill>
    ),
  },
  { key: "actions", header: "Actions", actions: true, cell: (r) => <RowActions row={r} /> },
]

export function AdminPartnersPage() {
  const [tab, setTab] = useState<string>(partnerTabs[0].value)
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("Any")
  const isSearching = query.trim().length > 0
  const isFiltered = isSearching || level !== "Any"

  const rows = useMemo(
    () =>
      partners.filter(
        (p) => matchesTab(p, tab) && matchesQuery(p, query) && matchesLevel(p, level),
      ),
    [tab, query, level],
  )
  const tabTotal = partnerTabs.find((t) => t.value === tab)?.total ?? partners.length

  const exportCsv = () => {
    downloadCsv(
      `vedora-partners-${tab}${level === "Any" ? "" : `-${level.toLowerCase().replace(" ", "")}`}.csv`,
      [
        "VEDORA ID",
        "Name",
        "Mobile",
        "Sponsor",
        "Level",
        "Slots used",
        "Team",
        "Wallet (INR)",
        "Status",
      ],
      rows.map((r) => [
        r.id,
        r.name,
        r.mobile,
        r.sponsor,
        r.level,
        r.slotsUsed,
        r.team,
        r.wallet,
        statusLabel[r.status].text,
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="Partners"
        subtitle="6,482 records · 3 Founders (fixed) · IDs auto-generated from VED000004"
        actions={
          <Input
            type="search"
            placeholder="Search ID, name or mobile…"
            aria-label="Search partners"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-72"
          />
        }
      />
      <PageBody>
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              tabs={partnerTabs}
              value={tab}
              onValueChange={setTab}
              aria-label="Partner status"
            />
            <div className="flex items-center gap-2">
              <FilterSelect
                label="Level"
                options={LEVEL_OPTIONS}
                defaultValue={level}
                onValueChange={setLevel}
              />
              <Button
                variant="outline"
                className="h-10 md:h-9"
                disabled={rows.length === 0}
                onClick={exportCsv}
              >
                Export CSV
              </Button>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (r.founder ? "bg-muted/30" : undefined)}
            emptyMessage={
              isSearching
                ? `No partners match "${query.trim()}".`
                : "No partners match this filter."
            }
          />
          <TablePagination
            summary={
              isFiltered
                ? `${rows.length} result${rows.length === 1 ? "" : "s"}` +
                  (level !== "Any" ? ` · ${level}` : "") +
                  (isSearching ? ` for "${query.trim()}"` : "")
                : `Showing 1–${rows.length} of ${formatNumber(tabTotal)}`
            }
            pages={isFiltered || tab !== "all" ? 1 : 3}
          />
        </Panel>
      </PageBody>
    </>
  )
}
