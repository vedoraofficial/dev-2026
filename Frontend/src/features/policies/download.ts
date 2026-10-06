import type { Policy } from "@/features/policies/mock-data"
import { downloadPolicyPdf } from "@/lib/pdf"

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function downloadPolicy(policy: Policy): void {
  downloadPolicyPdf(`vedora-${slug(policy.title)}.pdf`, policy.title, policy.body)
}
