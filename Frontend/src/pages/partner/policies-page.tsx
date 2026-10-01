import { PageBody, PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { policies, type Policy } from "@/features/policies/mock-data"
import { downloadPolicyPdf } from "@/lib/pdf"

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function downloadPolicy(policy: Policy): void {
  downloadPolicyPdf(`vedora-${slug(policy.title)}.pdf`, policy.title, policy.body)
}

function PolicyDialog({ policy }: { policy: Policy }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="py-1 font-medium text-gold hover:underline">
          Read
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{policy.title}</DialogTitle>
          <DialogDescription>{policy.detail}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-[0.8125rem] leading-relaxed text-foreground/85">
          {policy.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <Button variant="outline" className="mt-2 w-full" onClick={() => downloadPolicy(policy)}>
          Download PDF
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export function PartnerPoliciesPage() {
  return (
    <>
      <PageHeader title="Policies" subtitle="Ten published policies for partners and customers" />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {policies.map((policy) => (
            <article
              key={policy.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-4 md:p-5"
            >
              <h2 className="text-[0.9375rem] font-medium">{policy.title}</h2>
              <p className="mt-1.5 text-xs text-muted-foreground">{policy.detail}</p>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <PolicyDialog policy={policy} />
                <button
                  type="button"
                  className="py-1 text-muted-foreground hover:text-foreground"
                  onClick={() => downloadPolicy(policy)}
                >
                  Download PDF
                </button>
              </div>
            </article>
          ))}
        </div>
      </PageBody>
    </>
  )
}
