export type EnquiryStatus = "NEW" | "CONTACTED"

/** GET /api/enquiries — a message sent from the website's contact page. */
export type Enquiry = {
  id: number
  name: string
  mobile: string
  email: string
  /** Order or Partner ID the person typed, if any */
  reference: string | null
  topic: string
  message: string
  status: EnquiryStatus
  createdAt: string
  updatedAt: string
}

/** POST /api/public/enquiries — the website's "Send us a message" form. */
export type EnquiryInput = {
  name: string
  mobile: string
  email: string
  reference?: string
  topic: string
  message: string
}
