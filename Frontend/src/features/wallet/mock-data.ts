import type { TimelineStep } from "@/components/common/timeline"

export const walletSummary = {
  balance: 48600,
  partnerId: "VED000418",
  bank: "HDFC ****4821",
  pendingPayout: 8000,
  withdrawn: 77800,
}

export type WalletTxnStatus = "success" | "pending" | "failed"

export type WalletTxn = {
  id: string
  title: string
  when: string
  source: string
  status: WalletTxnStatus
  /** Positive = credit, negative = debit */
  amount: number
}

export const walletTransactions: WalletTxn[] = [
  {
    id: "1",
    title: "Direct Sale Commission",
    when: "18 Sep 2026 · 11:04",
    source: "VED000631",
    status: "success",
    amount: 200,
  },
  {
    id: "2",
    title: "Level 1 BV Income",
    when: "18 Sep 2026 · 11:04",
    source: "VED000631",
    status: "success",
    amount: 100,
  },
  {
    id: "3",
    title: "Withdrawal request",
    when: "17 Sep 2026 · 18:40",
    source: "WD-00214",
    status: "pending",
    amount: -8000,
  },
  {
    id: "4",
    title: "Level 3 BV Income",
    when: "16 Sep 2026 · 09:22",
    source: "VED000588",
    status: "success",
    amount: 100,
  },
  {
    id: "5",
    title: "Product purchase · 5 units",
    when: "14 Sep 2026 · 15:10",
    source: "ORD-01188",
    status: "failed",
    amount: -9995,
  },
]

export const payoutTimeline: TimelineStep[] = [
  { title: "Request raised", meta: "17 Sep · 18:40 · ₹8,000", done: true },
  { title: "Under admin review", meta: "18 Sep · 09:15", done: true },
  { title: "Approved", done: false },
  { title: "Credited to bank", done: false },
]

export const srpWallet = {
  balance: 24,
  max: 50,
  earned: 220,
  redeemed: 196,
  tiers: [
    { points: 10, label: "1 month" },
    { points: 20, label: "2 months" },
    { points: 30, label: "3 months" },
    { points: 40, label: "4 months" },
    { points: 50, label: "5 months" },
  ],
}

export const activationTimeline = [
  { month: "July 2026", note: "First sale → Active", status: "Active", tone: "success" as const },
  {
    month: "August 2026",
    note: "Auto Free Active month",
    status: "Free Active",
    tone: "pending" as const,
  },
  {
    month: "September 2026",
    note: "1 confirmed sale done",
    status: "Active",
    tone: "success" as const,
  },
  {
    month: "October 2026",
    note: "Secured by September sale",
    status: "Active",
    tone: "success" as const,
  },
  {
    month: "November 2026",
    note: "Needs 1 sale in October",
    status: "Pending",
    tone: "neutral" as const,
  },
]

export const srpLedger = [
  {
    id: "1",
    date: "18 Sep 2026",
    event: "Confirmed bracelet sale",
    reference: "ORD-01204",
    change: 2,
    balance: 24,
  },
  {
    id: "2",
    date: "16 Sep 2026",
    event: "Confirmed bracelet sale",
    reference: "ORD-01198",
    change: 2,
    balance: 22,
  },
  {
    id: "3",
    date: "01 Aug 2026",
    event: "Auto redemption — no sale in July",
    reference: "System",
    change: -10,
    balance: 20,
  },
  {
    id: "4",
    date: "28 Jul 2026",
    event: "Confirmed bracelet sale",
    reference: "ORD-00982",
    change: 2,
    balance: 30,
  },
]
