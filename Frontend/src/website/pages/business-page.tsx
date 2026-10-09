import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { PageHero } from "@/website/components/common/page-hero"
import { Section, SectionHeading } from "@/website/components/common/section"
import { Button } from "@/website/components/ui/button"
import { IncomeTable } from "@/website/features/business/components/income-table"
import { LevelBars } from "@/website/features/business/components/level-bars"
import { SrpCard } from "@/website/features/business/components/srp-card"
import {
  HOW_IT_WORKS,
  INCOME_DISCLAIMER,
  PLAN,
  STRUCTURE_FACTS,
} from "@/website/features/business/plan"
import { PartnerInterestForm } from "@/website/features/enquiries/components/partner-interest-form"
import { formatINR, formatNumber } from "@/website/lib/format"

function IncomeTile({ label, amount, note }: { label: string; amount: number; note: string }) {
  return (
    <div className="rounded-xl border border-border bg-deep/60 p-4">
      <p className="text-[0.625rem] font-bold tracking-[0.14em] text-gold uppercase">{label}</p>
      <p className="mt-2 font-display text-[1.75rem] leading-none">{formatINR(amount)}</p>
      <p className="mt-1.5 text-[0.6875rem] text-muted-foreground">{note}</p>
    </div>
  )
}

export function BusinessPage() {
  return (
    <>
      <PageHero
        kicker="Business opportunity"
        title={
          <>
            Earn from every bracelet
            <br className="hidden md:block" /> — yours and your team's.
          </>
        }
        description="A simple five-level plan built on one product price. Sell a bracelet, earn a direct commission. Build a team, earn Business Volume income as they sell."
        actions={
          <>
            <Button size="lg" asChild>
              <Link to={ROUTES.becomePartner}>Register your interest</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={ROUTES.incomePlan}>See the income plan</Link>
            </Button>
          </>
        }
      />

      <Section>
        <SectionHeading kicker="How it works" title="Four steps to your first income" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border bg-card p-6">
              <p className="font-display text-[2rem] leading-none text-gold">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-[0.9375rem] font-bold">{s.title}</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="income-plan"
        tone="forest"
        divided
        containerClassName="grid items-start gap-10 lg:grid-cols-2 lg:gap-14"
      >
        <div>
          <SectionHeading
            kicker="The income plan"
            title={
              <>
                {formatINR(PLAN.totalPerSale)} paid out on
                <br className="hidden sm:block" /> every {formatINR(PLAN.price)} sale
              </>
            }
            description={`Each bracelet carries ${formatNumber(PLAN.bvPerSale)} Business Volume (1 BV = ₹1). When it sells, the seller earns ${formatINR(PLAN.directIncome)} directly and the BV is distributed up five levels of the seller's upline.`}
            className="mb-8 md:mb-8"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <IncomeTile
              label="Direct sale income"
              amount={PLAN.directIncome}
              note="To the partner who makes the sale"
            />
            <IncomeTile
              label="BV level income"
              amount={PLAN.levelIncome}
              note="Shared across Levels 1–5"
            />
          </div>
        </div>
        <IncomeTable />
      </Section>

      <Section divided>
        <SectionHeading
          kicker="The five levels"
          title="How your team is structured"
          aside={
            <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
              Up to {PLAN.directPartnersPerId} direct partners per ID and unlimited depth. Income is
              paid on the first five levels below you.
            </p>
          }
        />
        <LevelBars />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STRUCTURE_FACTS.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <p className="font-display text-[2rem] leading-none text-gold">{f.value}</p>
              <h3 className="mt-3 text-[0.875rem] font-bold">{f.title}</h3>
              <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="cream" containerClassName="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <SectionHeading
            kicker="Staying active"
            title={
              <>
                One sale a month keeps
                <br className="hidden sm:block" /> your income flowing
              </>
            }
            description="Your ID must be active to receive BV level income. You become active with your first purchase, the following month is free, and from then on one confirmed sale each month keeps you active."
            className="mb-4 md:mb-4"
          />
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
            Inactive days earn no BV income. One confirmed sale reactivates you instantly.
          </p>
        </div>
        <SrpCard />
      </Section>

      <Section id="register" containerClassName="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <SectionHeading
            kicker="Become a partner"
            title="Register your interest"
            description="Share your details and our team will call you to explain the plan and complete your registration. Have a sponsor? Add their VEDORA ID."
            className="mb-6 md:mb-6"
          />
          <p className="rounded-xl border border-border bg-card/60 p-4 text-[0.75rem] leading-relaxed text-muted-foreground">
            {INCOME_DISCLAIMER}
          </p>
          <Link
            to={ROUTES.portalLogin}
            className="mt-6 inline-block text-[0.8125rem] font-semibold text-gold hover:text-gold-light"
          >
            Already a partner? Log in →
          </Link>
        </div>
        <PartnerInterestForm />
      </Section>
    </>
  )
}
