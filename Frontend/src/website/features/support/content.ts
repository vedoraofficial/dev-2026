export const RESOLUTION_TIMELINES = [
  { topic: "Order & shipping", time: "3–5 business days" },
  { topic: "Payment issues", time: "3–7 business days" },
  { topic: "Returns & refunds", time: "7–10 business days" },
  { topic: "Partner queries", time: "7 business days" },
  { topic: "General complaints", time: "7 business days" },
] as const

export const GRIEVANCE_CHECKLIST = [
  "Full name",
  "Order ID or Partner ID",
  "Registered mobile number",
  "Email address",
  "Details of the complaint",
  "Photos or video, if applicable",
] as const

/**
 * FAQ answers. Only the first answer was written in the design; the rest are drawn from the
 * product, warranty and plan copy elsewhere on the site. Answers marked TODO need VEDORA's
 * confirmation before launch.
 */
export const FAQS = [
  {
    q: "Are the gemstones natural?",
    a: "Yes — every VEDORA bracelet uses 100% natural gemstone beads. Slight variation in colour, pattern and size is normal and proves authenticity.",
  },
  {
    q: "What does the warranty cover?",
    a: "Every bracelet carries a 7-day warranty against manufacturing defects from the date of delivery. If your package arrives damaged, report it within 48 hours with photos and an unboxing video.",
  },
  {
    q: "Do you offer Cash on Delivery?",
    a: "No. VEDORA accepts prepaid orders only — UPI, cards and net banking via Razorpay or PhonePe. A GST invoice is issued with every order.",
  },
  {
    q: "How long does delivery take?",
    a: "Orders are dispatched within 24–48 business hours. Delivery takes up to 7 days within Maharashtra and up to 14 days elsewhere in India.",
  },
  {
    // TODO(VEDORA): confirm the cancellation policy.
    q: "Can I cancel my order?",
    a: "Write to support with your Order ID as soon as possible. Our team will confirm whether the order can still be cancelled before dispatch, within 3–5 business days.",
  },
  {
    q: "How do I become a partner?",
    a: "Register your interest on the Become a Partner page and our team will call you. You join under a sponsor with your PAN and details, accept the Partner Agreement, and activate your ID with your first VEDORA bracelet purchase.",
  },
] as const
