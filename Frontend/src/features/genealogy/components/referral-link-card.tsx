import { Copy, Share2 } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** The public join page for a sponsor, e.g. https://app.vedora…/join/VED000021 */
const referralLink = (vedId: string) => `${window.location.origin}${ROUTES.join}/${vedId}`

/**
 * The signed-in partner's referral link: anyone who opens it can join VEDORA and is placed in
 * this partner's next free slot (POST /api/partner/join with their ID).
 */
export function ReferralLinkCard({ vedId }: { vedId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const link = referralLink(vedId)
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Join my VEDORA team — register here: ${link}`,
  )}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Referral link copied")
    } catch {
      // Clipboard blocked — select the text so it can be copied by hand.
      inputRef.current?.select()
      toast("Press Ctrl+C to copy the selected link")
    }
  }

  return (
    <Panel>
      <p className="mb-1 eyebrow">Referral link</p>
      <p className="mb-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
        Share this link. Whoever joins through it is placed in your next free slot, and you earn the
        direct commission on their orders.
      </p>
      <Input
        ref={inputRef}
        readOnly
        value={link}
        aria-label="Your referral link"
        onFocus={(e) => e.target.select()}
        className="font-mono text-xs"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => void copy()}>
          <Copy /> Copy
        </Button>
        <Button asChild variant="outline">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <Share2 /> WhatsApp
          </a>
        </Button>
      </div>
    </Panel>
  )
}
