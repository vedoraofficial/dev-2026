import type { Column } from "@/components/common/data-table"
import { StatusPill } from "@/components/common/status-pill"
import { categoryLabel } from "@/features/wallet/labels"
import type { WalletTransaction } from "@/features/wallet/types"
import { formatDateTime } from "@/lib/date"
import { formatINR, formatSignedINR } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"
import { cn } from "@/lib/utils"

/** Wallet history table: description, type, balance after and signed amount. */
export const walletTxnColumns: Column<WalletTransaction>[] = [
  {
    key: "description",
    header: "Description",
    primary: true,
    cell: (r) => (
      <div>
        <p className="text-[0.875rem] font-medium">{r.description || categoryLabel[r.category]}</p>
        <p className="text-[0.6875rem] text-muted-foreground">{formatDateTime(r.createdAt)}</p>
      </div>
    ),
  },
  {
    key: "category",
    header: "Type",
    cell: (r) => <StatusPill>{categoryLabel[r.category]}</StatusPill>,
  },
  {
    key: "balance",
    header: "Balance after",
    cell: (r) => (
      <span className="font-mono text-muted-foreground">
        {formatINR(paiseToRupees(r.balanceAfter))}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => {
      const rupees = paiseToRupees(r.amount) * (r.type === "DEBIT" ? -1 : 1)
      return (
        <span className={cn("font-mono", rupees > 0 ? "text-success" : "text-gold-light")}>
          {formatSignedINR(rupees)}
        </span>
      )
    },
  },
]

/** The ₹200-per-product credit the backend posts to the Admin wallet on every paid order. */
export const isAdminProductCommission = (t: WalletTransaction) =>
  t.category === "COMMISSION_DIRECT" &&
  !!t.description?.startsWith("Admin direct commission for product purchase")
