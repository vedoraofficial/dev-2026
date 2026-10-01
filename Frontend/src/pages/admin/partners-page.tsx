import { useState } from "react"
import { toast } from "sonner"

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
import { Label } from "@/components/ui/label"
import {
  partners as initialPartners,
  partnerTabs,
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
const PAGE_SIZE = 10

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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[0.8125rem]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

/** Read-only — opened by "View" for every partner, including Founders. */
function ViewPartnerDialog({ row }: { row: PartnerRow }) {
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
            <MonoId tone="gold">{row.id}</MonoId>
            {row.founder ? <span className="text-gold"> · Founder</span> : null}
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-3">
          <DetailRow label="Mobile" value={<span className="font-mono">{row.mobile}</span>} />
          <DetailRow label="Sponsor" value={<MonoId>{row.sponsor}</MonoId>} />
          <DetailRow label="Level" value={`L${row.level}`} />
          <DetailRow label="Direct slots" value={`${row.slotsUsed} / 20`} />
          <DetailRow label="Team" value={`${formatNumber(row.team)} partners`} />
          <DetailRow
            label="Wallet"
            value={<span className="font-mono">{formatINR(row.wallet)}</span>}
          />
          <DetailRow
            label="Status"
            value={
              <StatusPill variant={statusLabel[row.status].variant}>
                {statusLabel[row.status].text}
              </StatusPill>
            }
          />
        </dl>
      </DialogContent>
    </Dialog>
  )
}

/** Edits name + mobile. Not offered to Founders (their profile is locked). */
function EditPartnerDialog({
  row,
  onSave,
}: {
  row: PartnerRow
  onSave: (next: { name: string; mobile: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(row.name)
  const [mobile, setMobile] = useState(row.mobile)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setName(row.name)
          setMobile(row.mobile)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {row.name}</DialogTitle>
          <DialogDescription>
            <MonoId tone="gold">{row.id}</MonoId> · sponsor and placement are locked.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`name-${row.id}`} className="eyebrow">
              Full name
            </Label>
            <Input id={`name-${row.id}`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`mobile-${row.id}`} className="eyebrow">
              Mobile
            </Label>
            <Input
              id={`mobile-${row.id}`}
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="quiet" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onSave({ name: name.trim(), mobile: mobile.trim() })
              toast.success(`${name.trim()}'s profile updated`)
              setOpen(false)
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RowActions({
  row,
  onSaveProfile,
  onApprovePan,
  onActivate,
}: {
  row: PartnerRow
  onSaveProfile: (next: { name: string; mobile: string }) => void
  onApprovePan: () => void
  onActivate: () => void
}) {
  return (
    <>
      <ViewPartnerDialog row={row} />
      {row.founder ? (
        <Button variant="quiet" size="sm" disabled>
          Locked
        </Button>
      ) : row.status === "pan-pending" ? (
        <Button
          size="sm"
          onClick={() => {
            onApprovePan()
            toast.success(`${row.name}'s PAN approved — now Active`)
          }}
        >
          Review
        </Button>
      ) : row.status === "inactive" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onActivate()
            toast.success(`${row.name} reactivated`)
          }}
        >
          Activate
        </Button>
      ) : (
        <EditPartnerDialog row={row} onSave={onSaveProfile} />
      )}
    </>
  )
}

export function AdminPartnersPage() {
  const [allPartners, setAllPartners] = useState(initialPartners)
  const [tab, setTab] = useState<string>(partnerTabs[0].value)
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("Any")
  const isSearching = query.trim().length > 0
  const isFiltered = isSearching || level !== "Any"

  const rows = allPartners.filter(
    (p) => matchesTab(p, tab) && matchesQuery(p, query) && matchesLevel(p, level),
  )
  const tabTotal = partnerTabs.find((t) => t.value === tab)?.total ?? allPartners.length

  // Reset to page 1 whenever a filter changes (adjusting state during render — no effect needed).
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

  const updatePartner = (id: string, changes: Partial<PartnerRow>) =>
    setAllPartners((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)))

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
        <StatusPill variant={statusLabel[r.status].variant}>
          {statusLabel[r.status].text}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      actions: true,
      cell: (r) => (
        <RowActions
          row={r}
          onSaveProfile={(changes) => updatePartner(r.id, changes)}
          onApprovePan={() => updatePartner(r.id, { status: "active" })}
          onActivate={() => updatePartner(r.id, { status: "active" })}
        />
      ),
    },
  ]

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
            rows={pagedRows}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (r.founder ? "bg-muted/30" : undefined)}
            emptyMessage={
              isSearching
                ? `No partners match "${query.trim()}".`
                : "No partners match this filter."
            }
          />
          <TablePagination
            key={filterKey}
            summary={
              isFiltered
                ? `Showing ${rangeStart}–${rangeEnd} of ${rows.length} result${rows.length === 1 ? "" : "s"}` +
                  (level !== "Any" ? ` · ${level}` : "") +
                  (isSearching ? ` for "${query.trim()}"` : "")
                : `Showing ${rangeStart}–${rangeEnd} of ${formatNumber(tabTotal)}`
            }
            pages={totalPages}
            onPageChange={setPage}
          />
        </Panel>
      </PageBody>
    </>
  )
}
