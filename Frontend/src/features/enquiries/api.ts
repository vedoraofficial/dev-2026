import type { Enquiry, EnquiryInput, EnquiryStatus } from "@/features/enquiries/types"
import { api } from "@/lib/api"

/** POST /api/public/enquiries — no sign-in: the website contact form. */
export async function sendEnquiry(input: EnquiryInput): Promise<{ id: number; message: string }> {
  const { data } = await api.post<{ id: number; message: string }>("/public/enquiries", input)
  return data
}

/** GET /api/enquiries — [Admin] contact-form messages, newest first */
export async function getEnquiries(): Promise<Enquiry[]> {
  const { data } = await api.get<Enquiry[]>("/enquiries")
  return data
}

/** PATCH /api/enquiries/:id/status — [Admin] mark contacted (or back to new) */
export async function setEnquiryStatus({
  id,
  status,
}: {
  id: number
  status: EnquiryStatus
}): Promise<Enquiry> {
  const { data } = await api.patch<Enquiry>(`/enquiries/${id}/status`, { status })
  return data
}
