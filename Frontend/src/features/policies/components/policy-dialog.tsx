import type { ReactNode } from "react"

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
import type { Policy } from "@/features/policies/mock-data"

/**
 * Opens a policy over the current page (no navigation, so a half-filled form stays as it is).
 * `trigger` is the element that opens it; defaults to a "Read" link.
 */
export function PolicyDialog({ policy, trigger }: { policy: Policy; trigger?: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <button type="button" className="py-1 font-medium text-gold hover:underline">
            Read
          </button>
        )}
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
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-full"
          onClick={() => downloadPolicy(policy)}
        >
          Download PDF
        </Button>
      </DialogContent>
    </Dialog>
  )
}
