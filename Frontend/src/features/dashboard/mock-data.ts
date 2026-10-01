/** Sample data for the Partner dashboard. Replace with API calls in `api.ts` / `queries.ts`. */

export const partnerSummary = {
  firstName: "Rohit",
  partnerSince: "March 2026",
  walletBalance: 48600,
  walletThisWeek: 3200,
  totalIncome: 126400,
  directIncome: 55000,
  bvIncome: 71400,
  slotsUsed: 14,
  slotsMax: 20,
  teamSize: 214,
  teamActive: 198,
}

export const levelIncome = [
  { level: "Level 1 · 10%", amount: 12400 },
  { level: "Level 2 · 10%", amount: 9800 },
  { level: "Level 3 · 10%", amount: 7200 },
  { level: "Level 4 · 5%", amount: 3100 },
  { level: "Level 5 · 5%", amount: 1900 },
]

export const idActivation = {
  status: "Active",
  activeThrough: "October 2026",
  months: [
    { label: "Sep · active", state: "active" as const },
    { label: "Oct · secured", state: "active" as const },
    { label: "Nov · 1 sale", state: "pending" as const },
  ],
}

export const srpSummary = {
  balance: 24,
  max: 50,
  tiers: ["10 · 1 mo", "20 · 2 mo", "30 · 3 mo", "40 · 4 mo", "50 · 5 mo"],
}

export const recentJoinings = [
  { name: "Sneha Kulkarni", id: "VED000631", level: 3, when: "2h ago" },
  { name: "Imran Shaikh", id: "VED000629", level: 2, when: "Yesterday" },
  { name: "Meera Joshi", id: "VED000624", level: 3, when: "2 days" },
  { name: "Akash Patil", id: "VED000618", level: 3, when: "3 days" },
]
