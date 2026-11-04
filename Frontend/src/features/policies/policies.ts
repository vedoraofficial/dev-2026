export type Policy = {
  title: string
  detail: string
  body: string[]
  /** The official PDF in public/ — when set, "Download PDF" gives this file instead of a generated one */
  file?: string
}

export const policies: Policy[] = [
  {
    title: "Compensation Plan",
    detail: "5-level unilevel structure · ₹600 per sale",
    body: [
      "VEDORA runs a 5-level unilevel compensation plan. Every confirmed bracelet sale is worth 1,000 BV (Business Volume), where 1 BV = ₹1.",
      "The sponsor of a new partner earns a flat ₹200 Direct Income the moment that partner's first sale is confirmed.",
      "Level income is paid on BV generated anywhere in a partner's downline: 10% at Levels 1–3, and 5% at Levels 4–5.",
      "Each VEDORA ID can have a maximum of 20 BV-eligible direct placements. Partners placed beyond the 20th slot remain permanently valid in the genealogy tree, but generate no Direct or Level Income for that sponsor at any level.",
      "All commission calculations are performed and locked by the backend commission engine — no BV, level income or payout figure shown in the portal can be edited by a partner or Admin.",
    ],
  },
  {
    title: "ID Activation Criteria",
    detail: "Monthly activation, SRP and inactive rules",
    body: [
      "A VEDORA ID is Active for a calendar month once at least one confirmed sale is billed to that ID in that month, or the previous month's sale secures the following month automatically.",
      "Every confirmed sale also credits 2 SRP (Sales Reward Points) to the selling partner's SRP Wallet, up to a maximum balance of 50 SRP.",
      "If a partner makes no confirmed sale in a given month and is holding 10 SRP or more, the system automatically deducts 10 SRP and marks that month 'Free Active' — the ID stays active without a fresh sale.",
      "If no sale is made and the SRP balance is below 10, the ID is marked Inactive for that month. No BV or level income is credited to an ID on days it is inactive.",
    ],
  },
  {
    title: "Product, Price, Taxes & Warranty",
    detail: "₹1,999 MRP · GST · 7-day defect warranty",
    body: [
      "Every VEDORA bracelet SKU is sold at a fixed MRP of ₹1,999, inclusive of applicable GST. Partners may not sell above or below this MRP.",
      "Products are natural gemstone bracelets; minor variation in bead colour, size and pattern between pieces is a natural characteristic of the stone, not a defect.",
      "VEDORA offers a 7-day warranty from the date of delivery, covering manufacturing defects only — a broken clasp, snapped elastic, or a bead that has visibly cracked without external damage.",
      "The warranty does not cover damage from misuse, water exposure beyond normal wear, loss, or normal fading of colour with extended wear. A defect claim requires photos and the original order ID.",
    ],
  },
  {
    title: "Payment Terms & Conditions",
    detail: "Prepaid only — UPI, cards, net banking",
    body: [
      "All product orders and ID registrations on VEDORA are prepaid. Cash on delivery is not offered.",
      "Accepted payment methods are UPI, debit/credit cards and net banking, processed through Razorpay — the gateway empanelled for VEDORA's direct-selling settlements.",
      "Wallet withdrawals are settled by Admin to the partner's registered bank account only; VEDORA does not settle payouts to a third party's account.",
      "A failed or reversed payment does not activate an ID or confirm an order until a successful transaction is recorded against it.",
    ],
  },
  {
    title: "Shipping & Delivery",
    detail: "24–48 h processing · 7–14 day delivery",
    body: [
      "Confirmed orders are processed and handed to the courier partner within 24–48 hours, excluding Sundays and public holidays.",
      "Standard delivery takes 7–14 business days depending on the destination pin code. Remote and northeastern pin codes may take a few days longer.",
      "A tracking ID is shared by SMS and in the partner's My Orders page as soon as the shipment is dispatched.",
      "VEDORA is not responsible for delays caused by the courier network, incorrect address details provided at checkout, or force-majeure events.",
    ],
  },
  {
    title: "Cancellation Policy",
    detail: "Cancel before dispatch · 7–10 day refunds",
    body: [
      "An order can be cancelled free of charge any time before it is marked 'Dispatched' from My Orders or by Admin.",
      "Once an order is dispatched, it cannot be cancelled — it may only be returned after delivery under the warranty terms, if a manufacturing defect applies.",
      "Approved cancellations and defect returns are refunded to the original payment method within 7–10 business days of approval.",
      "ID registration fees are non-refundable once the VEDORA ID has been activated in the genealogy tree.",
    ],
  },
  {
    title: "Contact & Grievance Redressal",
    detail: "Support SLAs and escalation route",
    body: [
      "For order, payout or ID issues, partners should first raise a request through the support channel listed in the Admin portal's Contact page.",
      "General queries are acknowledged within 24 hours and resolved within 5 business days. Payout and payment disputes are prioritised and reviewed within 48 hours.",
      "Unresolved complaints are escalated to VEDORA's designated Grievance Officer, whose contact details are published on the company website and in the welcome kit issued at registration.",
    ],
  },
  {
    title: "Terms and Conditions",
    detail: "Partner and customer obligations",
    body: [
      "By registering, a partner agrees to represent VEDORA products and the compensation plan accurately, and not to make income guarantees to prospects.",
      "A VEDORA ID, once issued, is permanent — its placement, sponsor and upline cannot be changed after activation. Founder IDs sit directly under Root Admin and are locked at the database level.",
      "One PAN card may be linked to only one active VEDORA ID at a time.",
      "VEDORA reserves the right to suspend an ID found to be violating these terms, engaging in spam, or misrepresenting the compensation plan, after a documented review.",
    ],
  },
  {
    title: "Privacy Policy",
    detail: "How VEDORA handles your data",
    body: [
      "VEDORA collects the name, mobile number, address, PAN and bank details needed to register an ID, process orders and settle payouts.",
      "This data is used only for order fulfilment, commission processing, tax compliance and support — it is never sold to third parties.",
      "Payment details are handled by Razorpay directly; VEDORA does not store card numbers or UPI credentials on its own servers.",
      "A partner may request a copy of, or the deletion of, their personal data by writing to the Grievance Officer, subject to statutory record-keeping requirements.",
    ],
  },
  {
    title: "Consumer Grievance Redressal Mechanism",
    detail: "How to complain, timelines and Grievance Officer",
    file: "/policies/vedora-consumer-grievance-redressal-mechanism.pdf",
    body: [
      "1. Consumer Grievance Policy — VEDORA is committed to providing a transparent, fair, and timely grievance redressal mechanism for all customers and partners. Every complaint will be handled professionally, fairly, and confidentially.",
      "2. How to Submit a Complaint — Customers or partners can raise a complaint through the official VEDORA support channels by providing the following details: Full Name; Order ID or Partner ID; Registered Mobile Number; Email Address; Details of the Complaint; Supporting Photos or Videos (if applicable).",
      "3. Types of Grievances — VEDORA accepts grievances related to: product quality or manufacturing defects; wrong or damaged products received; shipping and delivery issues; payment-related issues; return and refund requests; partner account, activation, or commission-related queries.",
      "4. Resolution Timeline — Order & Shipping Issues: 3–5 Business Days. Payment Issues: 3–7 Business Days. Return & Refund Requests: 7–10 Business Days. Partner & Commission Queries: Up to 7 Business Days.",
      "All registered consumer complaints will be acknowledged within 48 hours and resolved within a maximum period of 30 days from the date of receipt, in accordance with applicable laws.",
      "5. Escalation Process — If a customer or partner is not satisfied with the initial resolution, or if the complaint remains unresolved, they may escalate the matter directly to the designated Grievance Officer through the official support email. VEDORA will review the complaint and take appropriate action to resolve the matter fairly and transparently.",
      "6. Grievance Officer Details — Name: Sheetal Bhor. Designation: Grievance Officer – VEDORA. Official Email: info@vedoraofficial.com. Business Address: Badlapur, Maharashtra, India. Working Hours: Monday to Saturday, 10:00 AM to 6:00 PM (IST).",
      "7. Acknowledgement and Final Resolution — Every registered complaint will receive a formal acknowledgement within 48 hours. A complaint reference or ticket number will be provided for tracking purposes. VEDORA will conduct an appropriate internal review and verification. All consumer grievances will be resolved within a maximum period of 30 days from the date of receipt, in accordance with applicable laws.",
    ],
  },
]
