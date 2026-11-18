import type { PolicySection } from "@/website/features/legal/privacy-policy"

export const CANCELLATION_POLICY: readonly PolicySection[] = [
  {
    id: "order-cancellation",
    title: "Order Cancellation",
    body: "Customers may cancel their order before it is dispatched from the VEDORA warehouse.",
  },
  {
    id: "how-to-cancel",
    title: "How to Cancel an Order",
    body: "To cancel an order, contact VEDORA Customer Support with your Order ID as soon as possible through the official website, email, or WhatsApp support.",
  },
  {
    id: "after-dispatch",
    title: "Cancellation After Dispatch",
    body: "Orders cannot be cancelled once they have been dispatched. After dispatch, the order will be covered under the Return & Refund Policy, if applicable.",
  },
  {
    id: "refund",
    title: "Refund for Cancelled Orders",
    body: "Refunds depend on how the order was paid:",
    list: [
      "Prepaid Orders: the full amount is refunded to the original payment method within 7–10 business days after cancellation approval.",
      "COD Orders: no refund is applicable if the order is cancelled before dispatch, as no payment has been collected.",
    ],
  },
  {
    id: "cancellation-by-vedora",
    title: "Cancellation by VEDORA",
    body: "VEDORA reserves the right to cancel an order for the reasons below — prepaid customers receive a full refund in every such case:",
    list: [
      "Product unavailability.",
      "Payment verification failure.",
      "Incorrect or incomplete shipping address.",
      "Any suspected fraudulent activity.",
    ],
  },
  {
    id: "important-note",
    title: "Important Note",
    body: "VEDORA may refuse repeated cancellations or fraudulent orders to protect customers and the company from misuse.",
  },
]
