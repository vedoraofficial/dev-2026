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
import {
  directTeam,
  levelCounts,
  type TeamMember,
  type TeamMemberStatus,
} from "@/features/team/mock-data"
import { cn } from "@/lib/utils"

const statusPill: Record<TeamMemberStatus, { label: string; variant: PillVariant }> = {
  active: { label: "Active", variant: "success" },
  "free-active": { label: "Free Active", variant: "pending" },
  "no-bv": { label: "No BV", variant: "danger" },
}

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

export function PartnerTeamPage() {
  return (
    <>
      <PageHeader
        title="My Team"
        subtitle="214 partners across 5 levels · 14 of 20 direct slots used"
        actions={
          <>
            <Input
              type="search"
              placeholder="Search name or VEDORA ID…"
              aria-label="Search team"
              className="w-full md:w-72"
            />
            <Button className="max-md:flex-1">Register partner</Button>
          </>
        }
      />
      <PageBody>
        <StatGrid cols={5} className="[&>*:first-child]:col-span-2 lg:[&>*:first-child]:col-span-1">
          {levelCounts.map((l) => (
            <StatCard
              key={l.level}
              highlight={l.level === 1}
              label={l.level === 1 ? "Level 1 · Direct" : `Level ${l.level}`}
              value={
                <>
                  {l.count}
                  {l.cap ? (
                    <span className="text-base text-muted-foreground"> / {l.cap}</span>
                  ) : null}
                </>
              }
            />
          ))}
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Team level"
              tabs={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Level ${n}` }))}
            />
            <div className="flex items-center gap-2">
              <FilterSelect label="Status" options={["All", "Active", "Free Active", "No BV"]} />
              <Button variant="outline" className="h-10 md:h-9">
                Export
              </Button>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={directTeam}
            getRowKey={(r) => r.id}
            rowClassName={(r) => (r.status === "no-bv" ? "bg-muted/30" : undefined)}
          />
          <TablePagination summary="Showing 6 of 14 direct partners" pages={3} />
        </Panel>
      </PageBody>
    </>
  )
}
