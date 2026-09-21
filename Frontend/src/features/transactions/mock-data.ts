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
  gateway: "Razorpay" | "PhonePe"
  method: string
  status: TxnStatus
  amount: number
}

export const transactions: Transaction[] = [
  {
    id: "TXN-884210",
    partnerId: "VED000631",
    touchpoint: "Partner registration",
    gateway: "Razorpay",
    method: "UPI",
    status: "success",
    amount: 1999,
  },
  {
    id: "TXN-884207",
    partnerId: "VED000418",
    touchpoint: "Bracelet purchase ×5",
    gateway: "PhonePe",
    method: "UPI",
    status: "success",
    amount: 9995,
  },
  {
    id: "TXN-884203",
    partnerId: "VED000455",
    touchpoint: "Wallet recharge",
    gateway: "PhonePe",
    method: "Net banking",
    status: "pending",
    amount: 5000,
  },
  {
    id: "TXN-884199",
    partnerId: "VED000462",
    touchpoint: "Withdrawal payout",
    gateway: "Razorpay",
    method: "IMPS",
    status: "success",
    amount: 60000,
  },
  {
    id: "TXN-884195",
    partnerId: "VED000508",
    touchpoint: "Bracelet purchase ×3",
    gateway: "Razorpay",
    method: "Card",
    status: "failed",
    amount: 5997,
  },
  {
    id: "TXN-884190",
    partnerId: "VED000629",
    touchpoint: "Partner registration",
    gateway: "Razorpay",
    method: "UPI",
    status: "success",
    amount: 1999,
  },
  {
    id: "TXN-884182",
    partnerId: "VED000478",
    touchpoint: "Wallet recharge",
    gateway: "PhonePe",
    method: "UPI",
    status: "success",
    amount: 3000,
  },
]
