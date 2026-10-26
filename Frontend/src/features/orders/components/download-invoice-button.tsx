import { useMutation } from "@tanstack/react-query"
import { FileDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { downloadInvoice } from "@/features/orders/api"

/** Paid orders: saves the GST invoice PDF (the same one emailed to the buyer). */
export function DownloadInvoiceButton({ orderId }: { orderId: number }) {
  const download = useMutation({
    mutationFn: () => downloadInvoice(orderId),
    onError: (err: Error) =>
      toast.error(err.message || "Couldn't download the invoice. Try again."),
  })

  return (
    <Button variant="outline" disabled={download.isPending} onClick={() => download.mutate()}>
      <FileDown aria-hidden />
      {download.isPending ? "Preparing…" : "Download invoice"}
    </Button>
  )
}
