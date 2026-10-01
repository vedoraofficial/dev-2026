export type WithdrawalStatus = "pending" | "approved" | "rejected"

export type WithdrawalRequest = {
  id: string
  partner: string
  partnerId: string
  bank: string
  walletBalance: number
  amount: number
  status: WithdrawalStatus
}

export const withdrawalRequests: WithdrawalRequest[] = [
  {
    id: "WD-00214",
    partner: "Rohit Deshmukh",
    partnerId: "VED000418",
    bank: "HDFC ****4821",
    walletBalance: 48600,
    amount: 8000,
    status: "pending",
  },
  {
    id: "WD-00213",
    partner: "Sneha Kulkarni",
    partnerId: "VED000455",
    bank: "SBI ****1190",
    walletBalance: 31200,
    amount: 15000,
    status: "pending",
  },
  {
    id: "WD-00212",
    partner: "Imran Shaikh",
    partnerId: "VED000462",
    bank: "ICICI ****7734",
    walletBalance: 102400,
    amount: 60000,
    status: "pending",
  },
  {
    id: "WD-00211",
    partner: "Meera Joshi",
    partnerId: "VED000478",
    bank: "Axis ****2265",
    walletBalance: 9400,
    amount: 9000,
    status: "pending",
  },
  {
    id: "WD-00210",
    partner: "Akash Patil",
    partnerId: "VED000491",
    bank: "Kotak ****5512",
    walletBalance: 22800,
    amount: 20000,
    status: "pending",
  },
  {
    id: "WD-00209",
    partner: "Pooja Nair",
    partnerId: "VED000568",
    bank: "HDFC ****9012",
    walletBalance: 17200,
    amount: 12000,
    status: "approved",
  },
  {
    id: "WD-00208",
    partner: "Karan Mehta",
    partnerId: "VED000512",
    bank: "SBI ****3345",
    walletBalance: 6200,
    amount: 5000,
    status: "rejected",
  },
]
