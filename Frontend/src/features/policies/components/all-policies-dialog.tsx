import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { downloadPolicy } from "@/features/policies/download"
import { policies, type Policy } from "@/features/policies/policies"

/**
 * Every published policy in a pop-up — the same cards as the portal's Policies page, then one
 * policy to read. For pages without a sign-in (the referral join page): nothing to log in to,
 * and a half-filled form underneath stays as it is.
 */
export function AllPoliciesDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [reading, setReading] = useState<Policy | null>(null)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setReading(null)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        {reading ? (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setReading(null)}
                className="w-fit text-xs font-medium text-gold hover:underline"
              >
                ← All policies
              </button>
              <DialogTitle>{reading.title}</DialogTitle>
              <DialogDescription>{reading.detail}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-[0.8125rem] leading-relaxed text-foreground/85">
              {reading.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => downloadPolicy(reading)}
            >
              Download PDF
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Policies</DialogTitle>
              <DialogDescription>Published policies for partners and customers</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {policies.map((policy) => (
                <article
                  key={policy.title}
                  className="flex flex-col rounded-2xl border border-border bg-card p-4"
                >
                  <h3 className="text-[0.9375rem] font-medium">{policy.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground">{policy.detail}</p>
                  <div className="mt-auto flex items-center gap-4 pt-4 text-xs">
                    <button
                      type="button"
                      className="py-1 font-medium text-gold hover:underline"
                      onClick={() => setReading(policy)}
                    >
                      Read
                    </button>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
