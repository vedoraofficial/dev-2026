import { Loader2, ShieldCheck, Wallet } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTopupWallet } from "@/features/payments/queries"
import { formatINR } from "@/lib/format"
import { rupeesToPaise } from "@/lib/money"

const MIN_TOPUP_RUPEES = 100
const MAX_TOPUP_RUPEES = 500000
const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBalance?: number
}

export function TopupDialog({ open, onOpenChange, currentBalance = 0 }: Props) {
  const [amountStr, setAmountStr] = useState("1000")
  const topupWallet = useTopupWallet()

  const amount = Number(amountStr) || 0
  const isTooLow = amount < MIN_TOPUP_RUPEES
  const isTooHigh = amount > MAX_TOPUP_RUPEES
  const isValid = amount >= MIN_TOPUP_RUPEES && amount <= MAX_TOPUP_RUPEES && !topupWallet.isPending

  const handleProceed = () => {
    if (!isValid) return
    topupWallet.mutate(rupeesToPaise(amount))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
              <Wallet className="size-4" />
            </div>
            <div>
              <DialogTitle>Add Money to Wallet</DialogTitle>
              <DialogDescription>
                Top up your wallet balance online via Razorpay (UPI, Cards, Net Banking).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Balance Reminder */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-field/50 px-3.5 py-2.5 text-xs">
            <span className="text-muted-foreground">Current available balance</span>
            <span className="font-mono font-medium">{formatINR(currentBalance)}</span>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="topup-amount">Amount (₹)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="topup-amount"
                type="number"
                min={MIN_TOPUP_RUPEES}
                max={MAX_TOPUP_RUPEES}
                step="100"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="1000"
                className="pl-7 font-mono text-base"
                disabled={topupWallet.isPending}
              />
            </div>

            {/* Validation warning */}
            {amount > 0 && isTooLow && (
              <p className="text-xs text-danger">Minimum top-up amount is ₹100.</p>
            )}
            {isTooHigh && (
              <p className="text-xs text-danger">Maximum single top-up amount is ₹5,00,000.</p>
            )}
          </div>

          {/* Quick Amount Chips */}
          <div className="space-y-1.5">
            <p className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
              Quick select
            </p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountStr(String(amt))}
                  disabled={topupWallet.isPending}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-mono transition-colors ${
                    amount === amt
                      ? "border-gold bg-gold/15 text-gold-light"
                      : "border-border hover:bg-muted text-foreground/80"
                  }`}
                >
                  +{formatINR(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-lg border border-border/80 bg-field/60 p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Recharge amount</span>
              <span className="font-mono text-foreground">{formatINR(amount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Gateway processing fee</span>
              <span className="text-success font-medium">Free (₹0)</span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-2 text-[0.8125rem] font-medium">
              <span>Total payable</span>
              <span className="font-display text-base text-gold">{formatINR(amount)}</span>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success shrink-0" />
            <span>256-bit encrypted checkout powered by Razorpay. Instant credit.</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={topupWallet.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValid}
            onClick={handleProceed}
            className="w-full sm:w-auto"
          >
            {topupWallet.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Opening Razorpay…
              </>
            ) : (
              `Pay ${formatINR(amount)} with Razorpay`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
