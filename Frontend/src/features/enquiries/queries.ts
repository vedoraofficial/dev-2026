import { useMutation, useQuery } from "@tanstack/react-query"

import { getEnquiries, sendEnquiry, setEnquiryStatus } from "@/features/enquiries/api"
import { useApiMutation } from "@/lib/mutation"

export const enquiryKeys = { all: ["enquiries"] as const }

/** New messages show up on their own: the list refreshes every 30 seconds. */
export const useEnquiries = () =>
  useQuery({ queryKey: enquiryKeys.all, queryFn: getEnquiries, refetchInterval: 30_000 })

export const useSetEnquiryStatus = () =>
  useApiMutation(setEnquiryStatus, {
    success: (_, v) => (v.status === "CONTACTED" ? "Marked as contacted" : "Moved back to new"),
    invalidate: [enquiryKeys.all],
  })

/** Website contact form — the form shows its own thank-you pop-up and error line. */
export const useSendEnquiry = () => useMutation({ mutationFn: sendEnquiry })
