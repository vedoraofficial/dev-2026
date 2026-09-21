/** Sample data for the Admin Overview. Replace with API calls in `api.ts` / `queries.ts`. */

export const overviewStats = {
  totalPartners: 6482,
  joinedThisMonth: 412,
  productSales: 1840,
  bvGenerated: 1840000,
  commissionPaid: 1104000,
  commissionPerSale: 600,
  pendingWithdrawals: 9,
  pendingPayout: 184000,
}

/** Last 12 weeks. `bv` is the full bar; `joinings` is the gold part at the bottom. */
export const weeklyTrend = [
  { week: "W1", bv: 136, joinings: 60 },
  { week: "W2", bv: 176, joinings: 74 },
  { week: "W3", bv: 156, joinings: 68 },
  { week: "W4", bv: 216, joinings: 88 },
  { week: "W5", bv: 216, joinings: 102 },
  { week: "W6", bv: 250, joinings: 94 },
  { week: "W7", bv: 256, joinings: 114 },
  { week: "W8", bv: 276, joinings: 102 },
  { week: "W9", bv: 316, joinings: 122 },
  { week: "W10", bv: 316, joinings: 134 },
  { week: "W11", bv: 322, joinings: 114 },
  { week: "W12", bv: 330, joinings: 140 },
]

export const actionQueue = [
  { label: "Withdrawals pending", count: 9, tone: "neutral" as const },
  { label: "PAN awaiting verification", count: 23, tone: "neutral" as const },
  { label: "Failed payments", count: 6, tone: "danger" as const },
  { label: "Manual placements queued", count: 4, tone: "neutral" as const },
]

export const activityLog = [
  {
    text: "Commission engine ran for order ORD-01204",
    meta: "₹600 distributed · 11:04",
    recent: true,
  },
  {
    text: "VED000601 placed manually in slot 21",
    meta: "BV excluded for sponsor · 10:22",
    recent: true,
  },
  { text: "Product 02 price reviewed — unchanged", meta: "Yesterday · 17:48", recent: false },
  { text: "Announcement published to 6,482 partners", meta: "15 Sep · 09:30", recent: false },
]

export const founderLegs = [
  { id: "VED000001", partners: 2981 },
  { id: "VED000002", partners: 2139 },
  { id: "VED000003", partners: 1362 },
]
