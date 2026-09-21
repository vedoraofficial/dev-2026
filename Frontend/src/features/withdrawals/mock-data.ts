export type WithdrawalRequest = {
  id: string
  partner: string
  partnerId: string
  bank: string
  walletBalance: number
  amount: number
}

export const withdrawalRequests: WithdrawalRequest[] = [
  {
    id: "WD-00214",
    partner: "Rohit Deshmukh",
    partnerId: "VED000418",
    bank: "HDFC ****4821",
    walletBalance: 48600,
    amount: 8000,
  },
  {
    id: "WD-00213",
    partner: "Sneha Kulkarni",
    partnerId: "VED000455",
    bank: "SBI ****1190",
    walletBalance: 31200,
    amount: 15000,
  },
  {
    id: "WD-00212",
    partner: "Imran Shaikh",
    partnerId: "VED000462",
    bank: "ICICI ****7734",
    walletBalance: 102400,
    amount: 60000,
  },
  {
    id: "WD-00211",
    partner: "Meera Joshi",
    partnerId: "VED000478",
    bank: "Axis ****2265",
    walletBalance: 9400,
    amount: 9000,
  },
  {
    id: "WD-00210",
    partner: "Akash Patil",
    partnerId: "VED000491",
    bank: "Kotak ****5512",
    walletBalance: 22800,
    amount: 20000,
  },
]
