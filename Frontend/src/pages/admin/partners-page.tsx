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
import { formatCompactINR, formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const statusLabel: Record<PartnerStatus, { text: string; variant: PillVariant }> = {
  active: { text: "Active", variant: "success" },
  "pan-pending": { text: "PAN pending", variant: "pending" },
  inactive: { text: "Inactive", variant: "danger" },
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
  return (
    <>
      <PageHeader
        title="Partners"
        subtitle="6,482 records · 3 Founders (fixed) · IDs auto-generated from VED000004"
        actions={
          <>
            <Input
              type="search"
              placeholder="Search ID, name or mobile…"
              aria-label="Search partners"
              className="w-full md:w-72"
            />
            <Button className="max-md:flex-1">Add partner</Button>
          </>
        }
      />
      <PageBody>
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs tabs={partnerTabs} aria-label="Partner status" />
            <div className="flex items-center gap-2">
              <FilterSelect
                label="Level"
                options={["Any", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]}
              />
              <Button variant="outline" className="h-10 md:h-9">
                Export CSV
              </Button>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={partners}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (r.founder ? "bg-muted/30" : undefined)}
          />
          <TablePagination summary="Showing 1–7 of 6,482" pages={3} />
        </Panel>
      </PageBody>
    </>
  )
}
