import { CheckCheck, Inbox, Mail, MailOpen, Phone, RotateCcw, UserCheck } from "lucide-react"
import { useState, type ReactNode } from "react"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEnquiries, useSetEnquiryStatus } from "@/features/enquiries/queries"
import type { Enquiry } from "@/features/enquiries/types"
import { formatDateTime, timeAgo } from "@/lib/date"
import { formatNumber } from "@/lib/format"

const TABS = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "ALL", label: "All" },
]

function EnquiryStatusPill({ e }: { e: Enquiry }) {
  return e.status === "NEW" ? (
    <StatusPill variant="pending" dot>
      New
    </StatusPill>
  ) : (
    <StatusPill variant="success" dot>
      Contacted
    </StatusPill>
  )
}

/** Mark contacted / back to new */
function StatusButton({ e, size = "sm" }: { e: Enquiry; size?: "sm" | "default" }) {
  const setStatus = useSetEnquiryStatus()
  const contacted = e.status === "CONTACTED"
  return (
    <Button
      size={size}
      variant={contacted ? "outline" : "default"}
      disabled={setStatus.isPending}
      onClick={() => setStatus.mutate({ id: e.id, status: contacted ? "NEW" : "CONTACTED" })}
    >
      {contacted ? <RotateCcw /> : <CheckCheck />}
      {contacted ? "Mark as new" : "Mark contacted"}
    </Button>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 font-medium break-words">{children}</span>
    </div>
  )
}

/** Full message with quick call / email links. */
function EnquiryDialog({ e, onClose }: { e: Enquiry | null; onClose: () => void }) {
  return (
    <Dialog open={!!e} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        {e ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {e.name} <EnquiryStatusPill e={e} />
              </DialogTitle>
              <DialogDescription>
                {e.topic} · sent {formatDateTime(e.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="divide-y divide-border">
              <Detail label="Mobile">
                <a href={`tel:+91${e.mobile}`} className="text-gold hover:underline">
                  +91 {e.mobile}
                </a>
              </Detail>
              <Detail label="Email">
                <a href={`mailto:${e.email}`} className="text-gold hover:underline">
                  {e.email}
                </a>
              </Detail>
              <Detail label="Order / Partner ID">
                <span className="font-mono">{e.reference || "—"}</span>
              </Detail>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {e.message}
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href={`tel:+91${e.mobile}`}>
                  <Phone /> Call
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: your ${e.topic} enquiry`)}`}
                >
                  <Mail /> Email
                </a>
              </Button>
              <StatusButton e={e} size="default" />
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function AdminEnquiriesPage() {
  const enquiries = useEnquiries()
  const [tab, setTab] = useState("NEW")
  const [openId, setOpenId] = useState<number | null>(null)

  const all = enquiries.data ?? []
  const rows = tab === "ALL" ? all : all.filter((e) => e.status === tab)
  const newCount = all.filter((e) => e.status === "NEW").length
  const today = new Date().toDateString()
  const todayCount = all.filter((e) => new Date(e.createdAt).toDateString() === today).length
  // Re-read from the list so the dialog shows the latest status after a change
  const open = all.find((e) => e.id === openId) ?? null

  const columns: Column<Enquiry>[] = [
    {
      key: "name",
      header: "From",
      primary: true,
      cell: (e) => (
        <span className="flex min-w-0 flex-col">
          <span className="font-medium text-foreground">{e.name}</span>
          <span className="truncate text-xs text-muted-foreground">{e.email}</span>
        </span>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      cell: (e) => (
        <a href={`tel:+91${e.mobile}`} className="font-mono text-gold hover:underline">
          {e.mobile}
        </a>
      ),
    },
    {
      key: "topic",
      header: "Topic",
      cell: (e) => <StatusPill variant="gold">{e.topic}</StatusPill>,
    },
    {
      key: "reference",
      header: "Order / Partner ID",
      cell: (e) => <span className="font-mono">{e.reference || "—"}</span>,
    },
    {
      key: "message",
      header: "Message",
      cell: (e) => <span className="line-clamp-2 max-w-[22rem]">{e.message}</span>,
    },
    {
      key: "date",
      header: "Received",
      cell: (e) => <span title={formatDateTime(e.createdAt)}>{timeAgo(e.createdAt)}</span>,
    },
    { key: "status", header: "Status", cell: (e) => <EnquiryStatusPill e={e} /> },
    {
      key: "actions",
      header: "Actions",
      actions: true,
      cell: (e) => (
        <>
          <Button size="sm" variant="outline" onClick={() => setOpenId(e.id)}>
            <MailOpen /> View
          </Button>
          <StatusButton e={e} />
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Enquiries"
        subtitle="Messages sent from the website's contact page — call or email back, then mark them contacted"
      />
      <PageBody>
        <StatGrid>
          <StatCard
            label="New"
            icon={Inbox}
            value={enquiries.data ? formatNumber(newCount) : "—"}
            tone={newCount > 0 ? "warning" : undefined}
            hint="Waiting for a call back"
          />
          <StatCard
            label="Contacted"
            icon={UserCheck}
            value={enquiries.data ? formatNumber(all.length - newCount) : "—"}
          />
          <StatCard
            label="Today"
            icon={Mail}
            value={enquiries.data ? formatNumber(todayCount) : "—"}
          />
          <StatCard
            label="All messages"
            icon={MailOpen}
            value={enquiries.data ? formatNumber(all.length) : "—"}
          />
        </StatGrid>

        <Panel>
          <PanelHeader
            title="Contact-form messages"
            icon={Inbox}
            aside={
              <FilterTabs
                tabs={TABS.map((t) => ({
                  ...t,
                  label: t.value === "NEW" && newCount > 0 ? `New (${newCount})` : t.label,
                }))}
                value={tab}
                onValueChange={setTab}
                aria-label="Message status"
              />
            }
          />
          <QueryState query={enquiries} rows={3}>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(e) => e.id}
              emptyMessage={
                tab === "NEW" ? "No new messages — you're all caught up." : "No messages yet."
              }
            />
          </QueryState>
        </Panel>
      </PageBody>

      <EnquiryDialog e={open} onClose={() => setOpenId(null)} />
    </>
  )
}
