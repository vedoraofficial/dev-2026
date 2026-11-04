import { CircleCheck } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { useEffect, useState } from "react"

/** How long the pop-up stays before closing by itself */
const CLOSE_AFTER_MS = 3000

type Props = {
  open: boolean
  onClose: () => void
  /** First name of the person who wrote in, to greet them */
  name?: string
}

/**
 * "Message sent" pop-up after the contact form: tells the visitor the team will contact them,
 * then closes by itself after 3 seconds (a gold bar shows the time left). Esc / tap outside also close it.
 */
export function ThankYouPopup({ open, onClose, name }: Props) {
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!open) return
    // Start the countdown bar on the next frame so its width animates from full to empty
    const frame = requestAnimationFrame(() => setRunning(true))
    const timer = setTimeout(onClose, CLOSE_AFTER_MS)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      setRunning(false)
    }
  }, [open, onClose])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-deep/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-gold/40 bg-card text-center shadow-2xl shadow-deep/30 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="px-6 pt-8 pb-7">
            <span className="mx-auto grid size-14 place-items-center rounded-full border border-gold/40 bg-gold/15 text-gold-light">
              <CircleCheck aria-hidden className="size-7" />
            </span>
            <DialogPrimitive.Title className="mt-5 font-display text-[1.75rem] leading-tight">
              Message sent{name ? `, ${name}` : ""}!
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
              Thank you for writing to us. Our team will contact you shortly.
            </DialogPrimitive.Description>
          </div>
          <div aria-hidden className="h-1 bg-gold/15">
            <div
              className="h-full bg-gold transition-[width] ease-linear"
              style={{
                width: running ? "0%" : "100%",
                transitionDuration: running ? `${CLOSE_AFTER_MS}ms` : "0ms",
              }}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
