import { Link } from "react-router-dom"

import { ROUTES } from "@/app/routes"
import { MonoId } from "@/components/common/mono-id"
import { PageBody, PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Panel, PanelHeader } from "@/components/common/panel"
import { ProgressBar } from "@/components/common/progress-bar"
import { StatCard, StatGrid } from "@/components/common/stat-card"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  idActivation,
  levelIncome,
  partnerSummary as me,
  recentJoinings,
  srpSummary,
} from "@/features/dashboard/mock-data"
import { products } from "@/features/products/mock-data"
import { formatINR, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const featured = products[0]
const maxLevel = Math.max(...levelIncome.map((l) => l.amount))
const levelTotal = levelIncome.reduce((sum, l) => sum + l.amount, 0)
const levelShade = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

export function PartnerDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${me.firstName} · Partner since ${me.partnerSince}`}
        actions={
          <Input
            type="search"
            placeholder="Search partner ID…"
            aria-label="Search partner ID"
            className="w-full md:w-72"
          />
        }
      />
      <PageBody>
        <StatGrid>
          <StatCard
            label="Wallet balance"
            value={formatINR(me.walletBalance)}
            hint={<span className="text-success">▲ {formatINR(me.walletThisWeek)} this week</span>}
          />
          <StatCard
            label="Total income"
            value={formatINR(me.totalIncome)}
            hint={`Direct ${formatINR(me.directIncome)} · BV ${formatINR(me.bvIncome)}`}
          />
          <StatCard
            label="Direct slots used"
            value={
              <>
                {me.slotsUsed}{" "}
                <span className="text-lg text-muted-foreground">/ {me.slotsMax}</span>
              </>
            }
            hint={
              <ProgressBar
                value={me.slotsUsed}
                max={me.slotsMax}
                label="Direct slots used"
                className="mt-1"
              />
            }
          />
          <StatCard
            label="Team size"
            value={formatNumber(me.teamSize)}
            hint={`Across 5 income levels · ${me.teamActive} active`}
          />
        </StatGrid>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-4 md:space-y-5">
            <section className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-[1fr_minmax(0,42%)]">
              <div className="order-2 flex flex-col justify-center gap-3 p-5 sm:order-1 md:p-6">
                <p className="text-[0.625rem] tracking-[0.2em] text-gold uppercase">
                  New this month
                </p>
                <h2 className="font-display text-3xl leading-tight font-medium md:text-4xl">
                  {featured.name}
                </h2>
                <p className="text-xs text-muted-foreground">{featured.gemstones.join(" · ")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <Link to={ROUTES.partner.products}>Order stock</Link>
                  </Button>
                  <span className="font-mono text-xs text-gold-light">₹1,999 · 1,000 BV</span>
                </div>
              </div>
              <img
                src={featured.image}
                alt={featured.name}
                width={1000}
                height={750}
                className="order-1 aspect-[16/9] h-full w-full object-cover sm:order-2 sm:aspect-auto"
              />
            </section>

            <Panel>
              <PanelHeader
                title="BV Level Income — this month"
                aside={<span className="font-mono text-gold">{formatINR(levelTotal)} total</span>}
              />
              <div
                role="img"
                aria-label="Bar chart of BV level income for levels 1 to 5, falling from level 1 to level 5"
                className="flex h-60 items-end gap-2 sm:h-72 md:gap-4"
              >
                {levelIncome.map((l, i) => (
                  <div
                    key={l.level}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2 text-center"
                  >
                    <span className="font-mono text-[0.6875rem] text-foreground/85">
                      {formatINR(l.amount)}
                    </span>
                    <div
                      className={cn("w-full rounded-t-md", levelShade[i])}
                      style={{ height: `${(l.amount / maxLevel) * 78}%` }}
                    />
                    <span className="text-[0.625rem] leading-tight text-muted-foreground">
                      {l.level}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-4 md:space-y-5">
            <Panel>
              <PanelHeader
                title="ID activation"
                aside={<StatusPill variant="success">{idActivation.status}</StatusPill>}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                1 confirmed sale done this month — you are Active through{" "}
                <strong className="font-medium text-foreground">
                  {idActivation.activeThrough}
                </strong>
                .
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {idActivation.months.map((m) => (
                  <div key={m.label}>
                    <div
                      className={cn(
                        "h-1.5 rounded-full",
                        m.state === "active" ? "bg-success" : "bg-forest",
                      )}
                    />
                    <p className="mt-1.5 text-[0.625rem] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-border/70 pt-3 text-[0.6875rem] text-muted-foreground">
                No BV or level income is credited on days your ID is inactive.
              </p>
            </Panel>

            <Panel>
              <PanelHeader title="SRP wallet" aside="2 SRP per confirmed sale" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-4xl">
                  {srpSummary.balance} <span className="text-lg text-muted-foreground">SRP</span>
                </p>
                <p className="text-xs font-medium text-success">≈ 2 months free activation</p>
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
              <ul>
                {recentJoinings.map((j) => (
                  <li
                    key={j.id}
                    className="flex items-center gap-3 border-b border-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <PersonAvatar tone="plain" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] font-medium">{j.name}</p>
                      <p className="text-[0.6875rem] text-muted-foreground">
                        <MonoId tone="muted" className="text-[0.6875rem]">
                          {j.id}
                        </MonoId>{" "}
                        · Level {j.level}
                      </p>
                    </div>
                    <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
                      {j.when}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  )
}
