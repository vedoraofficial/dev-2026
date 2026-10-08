import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Panel, PanelHeader } from "@/components/common/panel"
import { PriceTag } from "@/components/common/price-tag"
import { ProgressBar } from "@/components/common/progress-bar"
import { QueryState } from "@/components/common/query-state"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMe } from "@/features/account/queries"
import { srpSummary } from "@/features/dashboard/mock-data"
import { useMySlots } from "@/features/genealogy/queries"
import { productArt } from "@/features/products/catalog"
import { useProducts } from "@/features/products/queries"
import { useCommissionIncome, useWalletSummary } from "@/features/wallet/queries"
import { formatDate, startOfMonth, timeAgo } from "@/lib/date"
import { formatBV, formatINR, formatNumber } from "@/lib/format"
import { paiseToRupees } from "@/lib/money"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import { normalizeVedId } from "@/lib/ved-id"

const levelShade = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

export function PartnerDashboardPage() {
  const navigate = useNavigate()
  const sessionUser = useSession((s) => s.user)
  const me = useMe()
  const wallet = useWalletSummary()
  const slots = useMySlots()
  const allIncome = useCommissionIncome()
  const monthIncome = useCommissionIncome({ fromDate: startOfMonth() })
  const products = useProducts()
  const [query, setQuery] = useState("")

  const firstName = (me.data?.name ?? sessionUser?.name ?? "").split(" ")[0]
  const filled = slots.data?.filledSlots ?? []
  const used = slots.data?.totalFilled ?? 0
  const max = slots.data?.maxSlots ?? 20
  const activeTeam = filled.filter((f) => f.partner.status === "ACTIVE").length
  const recent = [...filled]
    .sort((a, b) => b.partner.joinedAt.localeCompare(a.partner.joinedAt))
    .slice(0, 5)

  const levels = monthIncome.data?.levels ?? [0, 0, 0, 0, 0]
  const levelTotal = levels.reduce((a, b) => a + b, 0)
  const maxLevel = Math.max(1, ...levels)

  const featured = (products.data ?? []).find(
    (p) => p.status === "ACTIVE" && !(p.stockAvailable != null && p.stockAvailable <= 0),
  )

  const searchTeam = () => {
    if (!query.trim()) return
    const id = normalizeVedId(query)
    const match = filled.find((f) => f.partner.vedId === id)
    if (!match) {
      toast.error(`${id} isn't in your direct team`)
      return
    }
    navigate(`${ROUTES.partner.genealogy}?id=${match.partner.vedId}`)
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}${me.data ? ` · Partner since ${formatDate(me.data.createdAt)}` : ""}`}
        actions={
          <Input
            type="search"
            placeholder="Search partner ID…"
            aria-label="Search partner ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchTeam()}
            className="w-full md:w-72"
          />
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard
            href={ROUTES.partner.wallet}
            label="Wallet balance"
            value={wallet.data ? formatINR(paiseToRupees(wallet.data.availableBalance)) : "—"}
            hint={
              wallet.data?.lockedBalance
                ? `${formatINR(paiseToRupees(wallet.data.lockedBalance))} pending payout`
                : "Available to withdraw"
            }
          />
          <StatCard
            href={ROUTES.partner.incomeReports}
            label="Total income"
            value={allIncome.data ? formatINR(allIncome.data.total) : "—"}
            hint={
              allIncome.data
                ? `Direct ${formatINR(allIncome.data.direct)} · BV ${formatINR(allIncome.data.total - allIncome.data.direct)}`
                : undefined
            }
          />
          <StatCard
            href={ROUTES.partner.team}
            label="Direct slots used"
            value={
              <>
                {used} <span className="text-lg text-muted-foreground">/ {max}</span>
              </>
            }
            hint={<ProgressBar value={used} max={max} label="Direct slots used" className="mt-1" />}
          />
          <StatCard
            href={ROUTES.partner.team}
            label="Direct team"
            value={formatNumber(used)}
            hint={`${activeTeam} active`}
          />
        </StatGrid>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            {featured ? (
              <section className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-[1fr_minmax(0,42%)]">
                <div className="order-2 flex flex-col justify-center gap-3 p-5 sm:order-1 md:p-6">
                  <p className="text-[0.625rem] tracking-[0.2em] text-gold uppercase">
                    In the catalogue
                  </p>
                  <h2 className="font-display text-3xl leading-tight font-medium md:text-4xl">
                    {featured.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {productArt(featured.name).gemstones.join(" · ")}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Button asChild>
                      <Link to={ROUTES.partner.products}>Order stock</Link>
                    </Button>
                    <span className="font-mono text-xs text-gold-light">
                      <PriceTag
                        price={paiseToRupees(featured.salePrice)}
                        mrp={paiseToRupees(featured.mrp)}
                      />{" "}
                      · {formatBV(featured.bvAmount)}
                    </span>
                  </div>
                </div>
                <img
                  src={productArt(featured.name).image}
                  alt={featured.name}
                  width={1000}
                  height={750}
                  className="order-1 aspect-[16/9] h-full w-full object-cover sm:order-2 sm:aspect-auto"
                />
              </section>
            ) : null}

            <Panel>
              <PanelHeader
                title="BV Level Income — this month"
                aside={
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-gold">{formatINR(levelTotal)} total</span>
                    <Link
                      to={ROUTES.partner.incomeReports}
                      className="font-medium text-gold hover:underline"
                    >
                      View report →
                    </Link>
                  </span>
                }
              />
              <QueryState query={monthIncome} rows={4}>
                <div
                  role="img"
                  aria-label="Bar chart of BV level income for levels 1 to 5 this month"
                  className="flex h-60 items-end gap-2 sm:h-72 md:gap-4"
                >
                  {levels.map((amount, i) => (
                    <div
                      key={i}
                      className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2 text-center"
                    >
                      <span className="font-mono text-[0.6875rem] text-foreground/85">
                        {formatINR(amount)}
                      </span>
                      <div
                        className={cn("w-full rounded-t-md", levelShade[i])}
                        style={{ height: `${Math.max(2, (amount / maxLevel) * 78)}%` }}
                      />
                      <span className="text-[0.625rem] leading-tight text-muted-foreground">
                        Level {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </QueryState>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader title="SRP wallet" aside="2 SRP per confirmed sale" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-4xl">
                  {srpSummary.balance} <span className="text-lg text-muted-foreground">SRP</span>
                </p>
                <p className="text-xs font-medium text-muted-foreground">Sample — no SRP API yet</p>
              </div>
              <ProgressBar
                value={srpSummary.balance}
                max={srpSummary.max}
                label="SRP progress"
                className="mt-3"
              />
              <div className="mt-2 grid grid-cols-5 text-[0.5625rem] text-muted-foreground">
                {srpSummary.tiers.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Recent joinings"
                aside={
                  <Link to={ROUTES.partner.team} className="font-medium text-gold hover:underline">
                    View team
                  </Link>
                }
              />
              <QueryState
                query={slots}
                empty={recent.length === 0}
                emptyMessage="No one has joined under you yet."
              >
                <ul>
                  {recent.map((j) => (
                    <li
                      key={j.partner.vedId}
                      className="flex items-center gap-3 border-b border-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <PersonAvatar tone="plain" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.8125rem] font-medium">{j.partner.name}</p>
                        <p className="text-[0.6875rem] text-muted-foreground">
                          <MonoId tone="muted" className="text-[0.6875rem]">
                            {j.partner.vedId}
                          </MonoId>{" "}
                          · Slot {j.slotNumber}
                        </p>
                      </div>
                      <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
                        {timeAgo(j.partner.joinedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </QueryState>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
