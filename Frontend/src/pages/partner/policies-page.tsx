import { PageBody, PageHeader } from "@/components/common/page-header"
import { PolicyDialog } from "@/features/policies/components/policy-dialog"
import { downloadPolicy } from "@/features/policies/download"
import { policies } from "@/features/policies/mock-data"

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
