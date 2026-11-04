import type { Policy } from "@/features/policies/policies"
import { downloadPolicyPdf } from "@/lib/pdf"

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function downloadPolicy(policy: Policy): void {
  if (policy.file) {
    // The official PDF as VEDORA supplied it
    const link = document.createElement("a")
    link.href = policy.file
    link.download = `vedora-${slug(policy.title)}.pdf`
    link.click()
    return
  }
  downloadPolicyPdf(`vedora-${slug(policy.title)}.pdf`, policy.title, policy.body)
}
