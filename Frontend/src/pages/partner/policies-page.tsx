import { PageBody, PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"

const policies = [
  ["Compensation Plan", "5-level unilevel structure · ₹600 per sale"],
  ["ID Activation Criteria", "Monthly activation, SRP and inactive rules"],
  ["Product, Price, Taxes & Warranty", "₹1,999 MRP · GST · 7-day defect warranty"],
  ["Payment Terms & Conditions", "Prepaid only — UPI, cards, net banking"],
  ["Shipping & Delivery", "24–48 h processing · 7–14 day delivery"],
  ["Cancellation Policy", "Cancel before dispatch · 7–10 day refunds"],
  ["Contact & Grievance Redressal", "Support SLAs and escalation route"],
  ["Terms and Conditions", "Partner and customer obligations"],
  ["Privacy Policy", "How VEDORA handles your data"],
  ["Consumer Grievance Redressal Mechanism", "Complaint intake, SLAs and Grievance Officer"],
]

export function PartnerPoliciesPage() {
  return (
    <>
      <PageHeader
        title="Policies"
        subtitle="Ten published policies · agreement accepted at registration"
      />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {policies.map(([title, detail]) => (
            <article
              key={title}
              className="flex flex-col rounded-2xl border border-border bg-card p-4 md:p-5"
            >
              <h2 className="text-[0.9375rem] font-medium">{title}</h2>
              <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <button type="button" className="py-1 font-medium text-gold hover:underline">
                  Read
                </button>
                <button type="button" className="py-1 text-muted-foreground hover:text-foreground">
                  Download PDF
                </button>
              </div>
            </article>
          ))}
        </div>

        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[0.9375rem] font-medium">Partner Agreement accepted</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Accepted 14 Mar 2026, 11:42 IST from IP 103.21.58.14. All ten policies above were
              presented and agreed at registration.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Download agreement</Button>
            <Button variant="outline">View acceptance log</Button>
          </div>
        </Panel>
      </PageBody>
    </>
  )
}
