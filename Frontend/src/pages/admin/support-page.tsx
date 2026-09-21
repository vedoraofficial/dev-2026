import { DataTable, type Column } from "@/components/common/data-table"
import { FilterTabs } from "@/components/common/filter-tabs"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel, PanelHeader } from "@/components/common/panel"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill, type PillVariant } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"

type Ticket = {
  id: string
  name: string
  partnerId: string
  complaint: string
  category: string
  sla: { label: string; variant: PillVariant }
  action: "respond" | "escalate" | "view"
}

const tickets: Ticket[] = [
  {
    id: "GRV-0318",
    name: "Rohit Deshmukh",
    partnerId: "VED000418",
    complaint: "Commission not credited",
    category: "Partner & commission",
    sla: { label: "2 of 7 days", variant: "pending" },
    action: "respond",
  },
  {
    id: "GRV-0317",
    name: "Sneha Kulkarni",
    partnerId: "VED000455",
    complaint: "Package damaged on arrival",
    category: "Order & shipping",
    sla: { label: "4 of 5 days", variant: "pending" },
    action: "respond",
  },
  {
    id: "GRV-0314",
    name: "Pooja Nair",
    partnerId: "VED000568",
    complaint: "Refund not received",
    category: "Return & refund",
    sla: { label: "Overdue · 11 days", variant: "danger" },
    action: "escalate",
  },
  {
    id: "GRV-0311",
    name: "Akash Patil",
    partnerId: "VED000491",
    complaint: "SRP not added after sale",
    category: "Partner & commission",
    sla: { label: "Resolved", variant: "success" },
    action: "view",
  },
]

const columns: Column<Ticket>[] = [
  {
    key: "id",
    header: "Ticket",
    primary: true,
    cell: (r) => (
      <MonoId tone="gold" className="text-[0.8125rem]">
        {r.id}
      </MonoId>
    ),
  },
  {
    key: "by",
    header: "Raised by",
    cell: (r) => (
      <div>
        <p className="font-semibold">{r.name}</p>
        <MonoId tone="muted" className="text-[0.6875rem]">
          {r.partnerId}
        </MonoId>
      </div>
    ),
  },
  {
    key: "complaint",
    header: "Complaint",
    cell: (r) => <span className="text-foreground/85">{r.complaint}</span>,
  },
  {
    key: "category",
    header: "Category",
    cell: (r) => <span className="text-muted-foreground">{r.category}</span>,
  },
  {
    key: "sla",
    header: "SLA",
    cell: (r) => <StatusPill variant={r.sla.variant}>{r.sla.label}</StatusPill>,
  },
  {
    key: "action",
    header: "Action",
    actions: true,
    cell: (r) =>
      r.action === "respond" ? (
        <Button size="sm">Respond</Button>
      ) : r.action === "escalate" ? (
        <Button variant="destructive" size="sm">
          Escalate
        </Button>
      ) : (
        <Button variant="quiet" size="sm">
          View
        </Button>
      ),
  },
]

const intake = [
  "Full name",
  "Order ID or Partner ID",
  "Registered mobile number",
  "Email address",
  "Details of the complaint",
  "Supporting photos or video, if applicable",
]

const slaByCategory = [
  ["Order & shipping issues", "3–5 business days"],
  ["Payment issues", "3–7 business days"],
  ["Return & refund requests", "7–10 business days"],
  ["Partner & commission queries", "7 business days"],
  ["General complaints", "7 business days"],
]

export function AdminSupportPage() {
  return (
    <>
      <PageHeader
        title="Support & Grievance"
        subtitle="Complaint queue with SLA tracking and escalation"
        actions={<Button variant="outline">Export queue</Button>}
      />
      <PageBody>
        <StatGrid>
          <StatCard label="Open complaints" value="23" />
          <StatCard
            highlight
            label="Breaching SLA"
            value="4"
            hint="Escalate to Grievance Officer"
          />
          <StatCard label="Resolved this month" value="186" />
          <StatCard label="Avg. resolution" value="3.4 days" />
        </StatGrid>

        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <FilterTabs
              aria-label="Ticket status"
              tabs={[
                { value: "open", label: "Open 23" },
                { value: "escalated", label: "Escalated 4" },
                { value: "resolved", label: "Resolved" },
              ]}
            />
            <p className="text-[0.6875rem] text-muted-foreground">
              Grievance Officer · VEDORA Customer Support Team · Mon–Sat, 10:00–18:00 IST
            </p>
          </div>
          <DataTable columns={columns} rows={tickets} getRowKey={(r) => r.id} />
        </Panel>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
          <Panel>
            <PanelHeader title="Required at intake" />
            <ul className="space-y-3.5">
              {intake.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[0.8125rem] text-foreground/85"
                >
                  <span aria-hidden className="size-1.5 shrink-0 rotate-45 bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-border/70 pt-4 text-[0.6875rem] leading-relaxed text-muted-foreground">
              Accepted grievance types: product quality or defects, wrong or damaged product,
              shipping, payment, returns and refunds, partner account, activation or commission.
            </p>
          </Panel>

          <Panel>
            <PanelHeader
              title="Resolution SLA by category"
              aside="Per Consumer Grievance Redressal Mechanism"
            />
            <ul>
              {slaByCategory.map(([label, value]) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-3 border-b border-border/70 py-3 text-[0.8125rem] first:pt-0 last:border-b-0"
                >
                  <span className="text-foreground/85">{label}</span>
                  <span className="text-right text-xs font-medium text-gold-light">{value}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <p className="mb-4 eyebrow text-gold">Official support channel</p>
            <dl className="space-y-2.5 text-[0.8125rem]">
              {[
                ["Email", "support@vedoraofficial.in"],
                ["Website", "www.vedoraofficial.in"],
                ["Hours", "Mon–Sat, 10:00–18:00 IST"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap items-center justify-between gap-x-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="break-all">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[0.6875rem] leading-relaxed text-muted-foreground">
              Unresolved complaints escalate to the VEDORA Grievance Officer through the official
              support email.
            </p>
          </Panel>
        </div>
      </PageBody>
    </>
  )
}
