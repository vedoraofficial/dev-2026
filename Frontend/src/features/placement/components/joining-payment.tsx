import { Clock, CreditCard, Wallet } from "lucide-react"
import type { ReactNode } from "react"

import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"

/** PAY_LATER: the partner is created now with an inactive ID and pays from My Orders */
export type JoiningPaymentMethod = "WALLET" | "RAZORPAY" | "PAY_LATER"

type Props = {
  value: JoiningPaymentMethod
  onChange: (method: JoiningPaymentMethod) => void
  /** Sponsor's available balance in rupees; undefined while it loads */
  walletBalance: number | undefined
  /** Joining order price in rupees; undefined until a product is chosen */
  price: number | undefined
  /** Set when there's no wallet to pay from (referral join page) — the wallet option is greyed out */
  walletUnavailable?: string
  /** Add Partner: offer "Pay later" — the partner pays from My Orders and the ID activates then */
  allowPayLater?: boolean
}

function Option({
  selected,
  disabled,
  onSelect,
  icon,
  title,
  hint,
}: {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  icon: ReactNode
  title: string
  hint: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        selected ? "border-gold bg-gold/10 ring-3 ring-gold/20" : "border-border hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <span className={cn("mt-0.5", selected ? "text-gold" : "text-muted-foreground")}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium">{title}</span>
        <span className="block text-[0.6875rem] text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}

/** Who pays the joining order: the sponsor's wallet, or online with Razorpay. */
export function JoiningPayment({
  value,
  onChange,
  walletBalance,
  price,
  walletUnavailable,
  allowPayLater = false,
}: Props) {
  const walletShort = walletBalance !== undefined && price !== undefined && walletBalance < price

  return (
    <div className="space-y-2">
      <p className="eyebrow">Pay for the joining order</p>
      <div role="radiogroup" aria-label="Payment method" className="space-y-2">
        <Option
          selected={value === "WALLET"}
          disabled={walletShort || !!walletUnavailable}
          onSelect={() => onChange("WALLET")}
          icon={<Wallet className="size-4" aria-hidden />}
          title="My wallet"
          hint={
            walletUnavailable
              ? walletUnavailable
              : walletBalance === undefined
                ? "Loading balance…"
                : walletShort
                  ? `Balance ${formatINR(walletBalance)} — not enough for this order`
                  : `Balance ${formatINR(walletBalance)} · paid instantly`
          }
        />
        <Option
          selected={value === "RAZORPAY"}
          onSelect={() => onChange("RAZORPAY")}
          icon={<CreditCard className="size-4" aria-hidden />}
          title="Pay online"
          hint="UPI, cards or net banking (Razorpay)"
        />
        {allowPayLater ? (
          <Option
            selected={value === "PAY_LATER"}
            onSelect={() => onChange("PAY_LATER")}
            icon={<Clock className="size-4" aria-hidden />}
            title="Pay later"
            hint="The partner pays from My Orders · their ID activates once paid"
          />
        ) : null}
      </div>
    </div>
  )
}
