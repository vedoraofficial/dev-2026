import type { PillVariant } from "@/components/common/status-pill"

export type TxnStatus = "success" | "pending" | "failed"

export const txnStatusPill: Record<TxnStatus, { label: string; variant: PillVariant }> = {
  success: { label: "Success", variant: "success" },
  pending: { label: "Pending", variant: "pending" },
  failed: { label: "Failed", variant: "danger" },
}

export type Transaction = {
  id: string
  partnerId: string
  touchpoint: string
  gateway: "PhonePe"
  method: string
  status: TxnStatus
  amount: number
  /** "Today" ⊆ "Last 7 days" ⊆ "This month" — drives the Range filter. */
  when: "today" | "week" | "month"
}

export const transactions: Transaction[] = [
  {
    id: "TXN-884207",
    partnerId: "VED000418",
    touchpoint: "Bracelet purchase ×5",
    gateway: "PhonePe",
    method: "UPI",
    status: "success",
    amount: 9995,
    when: "today",
  },
  {
    id: "TXN-884203",
    partnerId: "VED000455",
    touchpoint: "Wallet recharge",
    gateway: "PhonePe",
    method: "Net banking",
    status: "pending",
    amount: 5000,
    when: "today",
  },
  {
    id: "TXN-884182",
    partnerId: "VED000478",
    touchpoint: "Wallet recharge",
    gateway: "PhonePe",
    method: "UPI",
    status: "success",
    amount: 3000,
    when: "today",
  },
  {
    id: "TXN-884170",
    partnerId: "VED000512",
    touchpoint: "Bracelet purchase ×1",
    gateway: "PhonePe",
    method: "UPI",
    status: "success",
    amount: 1999,
    when: "week",
  },
  {
    id: "TXN-884160",
    partnerId: "VED000629",
    touchpoint: "Partner registration",
    gateway: "PhonePe",
    method: "UPI",
    status: "failed",
    amount: 1999,
    when: "week",
  },
  {
    id: "TXN-884150",
    partnerId: "VED000549",
    touchpoint: "Wallet recharge",
    gateway: "PhonePe",
    method: "UPI",
    status: "success",
    amount: 2000,
    when: "month",
  },
  {
    id: "TXN-884140",
    partnerId: "VED000462",
    touchpoint: "Withdrawal payout",
    gateway: "PhonePe",
    method: "IMPS",
    status: "success",
    amount: 60000,
    when: "month",
  },
]
