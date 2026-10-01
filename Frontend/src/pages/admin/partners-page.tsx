import { useState } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { DataTable, type Column } from "@/components/common/data-table"
import { FilterSelect } from "@/components/common/filter-select"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Panel } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { TablePagination } from "@/components/common/table-pagination"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CreateUserDialog } from "@/features/account/components/create-user-dialog"
import { useNetwork, type NetworkMember } from "@/features/genealogy/use-network"
import { downloadCsv } from "@/lib/csv"
import { formatNumber } from "@/lib/format"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

/** Placement status from the genealogy (ACTIVE / PENDING / SUSPENDED). */
const statusLabel: Record<string, { text: string; variant: PillVariant }> = {
  ACTIVE: { text: "Active", variant: "success" },
  PENDING: { text: "Pending", variant: "pending" },
  SUSPENDED: { text: "Suspended", variant: "danger" },
}
const pill = (status: string) => statusLabel[status] ?? { text: status, variant: "neutral" }

const TABS = [
  { value: "all", label: "All" },
  { value: "founders", label: "Founders" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "SUSPENDED", label: "Suspended" },
]
const LEVEL_OPTIONS = ["Any", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6+"]
const PAGE_SIZE = 10

function matchesTab(m: NetworkMember, tab: string): boolean {
  if (tab === "all") return true
  if (tab === "founders") return m.isFounder
  return !m.isFounder && m.status === tab
}

function matchesQuery(m: NetworkMember, query: string): boolean {
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

/** Level 1 = Founders. "Level 6+" catches anyone deeper. */
function matchesLevel(m: NetworkMember, level: string): boolean {
  if (level === "Any") return true
  if (level === "Level 6+") return m.level >= 6
  return m.level === Number(level.replace("Level ", ""))
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[0.8125rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function ViewPartnerDialog({ row }: { row: NetworkMember }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="quiet" size="sm">
          View
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row.name}</DialogTitle>
          <DialogDescription>
            <MonoId tone="gold">{row.vedId}</MonoId>
            {row.isFounder ? <span className="text-gold"> · Founder</span> : null}
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-3">
          {row.isFounder ? null : (
            <>
              <DetailRow label="Mobile" value={<span className="font-mono">{row.mobile}</span>} />
              <DetailRow label="Email" value={row.email} />
            </>
          )}
          <DetailRow label="Sponsor" value={<MonoId>{row.sponsor}</MonoId>} />
          <DetailRow label="Founder leg" value={<MonoId>{row.founderId}</MonoId>} />
          <DetailRow label="Level" value={`L${row.level}`} />
          <DetailRow label="Slot" value={`${row.slot} / 20`} />
          <DetailRow label="Direct slots" value={`${row.direct} / 20`} />
          <DetailRow label="Team" value={`${formatNumber(row.team)} partners`} />
          <DetailRow
            label="Status"
            value={
              <StatusPill variant={pill(row.status).variant}>{pill(row.status).text}</StatusPill>
            }
          />
        </dl>
        <DialogFooter>
          <Button asChild variant="outline">
            <Link to={`${ROUTES.admin.genealogy}?id=${row.vedId}`}>Open genealogy</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const columns: Column<NetworkMember>[] = [
  {
    key: "partner",
    header: "Partner",
    primary: true,
    cell: (r) => (
      <div className="flex items-center gap-3">
        <PersonAvatar tone={r.isFounder ? "gold" : r.status === "ACTIVE" ? "plain" : "muted"} />
        <div className="min-w-0">
          <p className="truncate text-[0.875rem] font-medium">{r.name}</p>
          <p className="text-[0.6875rem]">
            <MonoId tone={r.isFounder ? "gold" : "muted"}>{r.vedId}</MonoId>
            {r.isFounder ? <span className="text-gold"> · Founder</span> : null}
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
        className={cn("text-[0.8125rem]", r.direct >= 20 ? "text-danger" : "text-foreground")}
      >
        {String(r.direct).padStart(2, "0")} / 20
      </MonoId>
    ),
  },
  {
    key: "team",
    header: "Team",
    cell: (r) => <span className="text-muted-foreground">{formatNumber(r.team)}</span>,
  },
  {
    key: "mobile",
    header: "Mobile",
    cell: (r) => <span className="font-mono text-[0.8125rem]">{r.mobile || "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => <StatusPill variant={pill(r.status).variant}>{pill(r.status).text}</StatusPill>,
  },
  {
    key: "actions",
    header: "Actions",
    actions: true,
    cell: (r) => <ViewPartnerDialog row={r} />,
  },
]

export function AdminPartnersPage() {
  const adminId = useSession((s) => s.user?.vedId)
  const network = useNetwork(adminId)
  const [tab, setTab] = useState("all")
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("Any")
  const isSearching = query.trim().length > 0

  const all = network.data ?? []
  const rows = all.filter(
    (m) => matchesTab(m, tab) && matchesQuery(m, query) && matchesLevel(m, level),
  )
  const tabs = TABS.map((t) => ({
    ...t,
    label: `${t.label} ${all.filter((m) => matchesTab(m, t.value)).length}`,
  }))

  const filterKey = `${tab}|${level}|${query}`
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

  const exportCsv = () =>
    downloadCsv(
      `vedora-partners-${tab.toLowerCase()}.csv`,
      [
        "VEDORA ID",
        "Name",
        "Mobile",
        "Email",
        "Sponsor",
        "Founder",
        "Level",
        "Slot",
        "Slots used",
        "Team",
        "Status",
      ],
      rows.map((r) => [
        r.vedId,
        r.name,
        r.mobile,
        r.email,
        r.sponsor,
        r.founderId,
        r.level,
        r.slot,
        r.direct,
        r.team,
        pill(r.status).text,
      ]),
    )

  return (
    <>
      <PageHeader
        title="Partners"
        subtitle={
          network.data
            ? `${formatNumber(all.length)} in the network · 3 Founders (fixed) · IDs auto-generated from VED000004`
            : "Loading the network…"
        }
        actions={
          <>
            <Input
              type="search"
              placeholder="Search ID, name, mobile…"
              aria-label="Search partners"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-72"
            />
            <CreateUserDialog />
          </>
        }
      />
      <PageBody>
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              tabs={tabs}
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
          <QueryState query={network} rows={6}>
            <DataTable
              columns={columns}
              rows={pagedRows}
              getRowKey={(r) => r.vedId}
              rowClassName={(r) => (r.isFounder ? "bg-muted/30" : undefined)}
              emptyMessage={
                isSearching
                  ? `No partners match "${query.trim()}".`
                  : "No partners match this filter."
              }
            />
            <TablePagination
              key={filterKey}
              summary={`Showing ${rangeStart}–${rangeEnd} of ${formatNumber(rows.length)}`}
              pages={totalPages}
              onPageChange={setPage}
            />
          </QueryState>
          <p className="mt-3 text-[0.6875rem] text-muted-foreground">
            Lists everyone placed in the genealogy. Users created with “Create user” appear here
            once they are placed under a sponsor.
          </p>
        </Panel>
      </PageBody>
    </>
  )
}
