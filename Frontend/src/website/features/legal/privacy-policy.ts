export type PolicySection = {
  id: string
  title: string
  body: string
  list?: readonly string[]
}

export const PRIVACY_POLICY: readonly PolicySection[] = [
  {
    id: "introduction",
    title: "Introduction",
    body: "VEDORA respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect customer and partner data.",
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: "We may collect:",
    list: [
      "Full Name",
      "Mobile Number",
      "Email Address",
      "Shipping Address",
      "Date of Birth (if provided)",
      "PAN and Aadhaar details for Partner KYC",
      "Payment and order information",
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    body: "Your information is used to:",
    list: [
      "Process orders and deliveries.",
      "Create and manage Partner IDs.",
      "Verify KYC details.",
      "Process commissions and payments.",
      "Send order updates, OTPs, and important notifications.",
    ],
  },
  {
    id: "data-protection",
    title: "Data Protection",
    body: "VEDORA uses reasonable security measures to protect your personal information from unauthorized access, misuse, or disclosure.",
  },
  {
    id: "information-sharing",
    title: "Information Sharing",
    body: "VEDORA does not sell or rent your personal information to third parties. Information may be shared only with payment gateways, courier partners, or when required by law.",
  },
  {
    id: "cookies",
    title: "Cookies",
    body: "Our website may use cookies to improve user experience, remember login sessions, and analyze website performance.",
  },
  {
    id: "user-rights",
    title: "User Rights",
    body: "You may request to update or correct your personal information through your VEDORA account or customer support.",
  },
  {
    id: "policy-updates",
    title: "Policy Updates",
    body: "VEDORA may update this Privacy Policy from time to time. Updated versions will be published on the official website.",
  },
  {
    id: "contact",
    title: "Contact",
    body: "For privacy-related questions or requests, contact VEDORA Customer Support through the official website or registered support email.",
  },
]
