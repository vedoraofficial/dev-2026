export type Notification = {
  id: string
  title: string
  detail: string
  time: string
  read: boolean
}

/** Root Admin — system-wide events. Mirrors the Overview action queue / activity log. */
export const adminNotifications: Notification[] = [
  {
    id: "1",
    title: "9 withdrawal requests pending",
    detail: "₹1,84,000 awaiting approval",
    time: "11 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Meera Joshi — PAN review needed",
    detail: "VED000478 · submitted for verification",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    title: "6 payments failed today",
    detail: "Gateway: Razorpay, PhonePe",
    time: "2h ago",
    read: false,
  },
  {
    id: "4",
    title: "Commission engine ran for ORD-01204",
    detail: "₹600 distributed across 5 levels",
    time: "Yesterday · 17:48",
    read: true,
  },
  {
    id: "5",
    title: "Announcement published",
    detail: "Sent to 6,482 partners",
    time: "15 Sep · 09:30",
    read: true,
  },
]

/** Partner / Founder — personal events. Mirrors the Dashboard and Wallet activity. */
export const partnerNotifications: Notification[] = [
  {
    id: "1",
    title: "₹200 direct commission credited",
    detail: "From VED000631 · Direct Sale",
    time: "18 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Sneha Kulkarni joined your team",
    detail: "VED000631 · placed at Level 1, slot 09",
    time: "2h ago",
    read: false,
  },
  {
    id: "3",
    title: "Withdrawal request approved",
    detail: "₹8,000 credited to HDFC ****4821",
    time: "Yesterday · 09:15",
    read: false,
  },
  {
    id: "4",
    title: "SRP balance reached 24",
    detail: "12 more to unlock 3 months free activation",
    time: "2 days ago",
    read: true,
  },
  {
    id: "5",
    title: "ID activation secured through October",
    detail: "1 confirmed sale this month",
    time: "3 days ago",
    read: true,
  },
]
