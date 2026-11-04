import { Gem, Hand, ReceiptText, ShieldCheck, Sparkles } from "lucide-react"

import logoImage from "@/assets/images/vedora-logo.jpg"
import { BulletList } from "@/website/components/common/bullet-list"
import { GoldWord } from "@/website/components/common/gold-word"
import { InfoCard } from "@/website/components/common/info-card"
import { HeroChips, HeroStatCards, PageHero } from "@/website/components/common/page-hero"
import { Kicker, Section, SectionHeading } from "@/website/components/common/section"
import { FounderCard } from "@/website/features/about/components/founder-card"
import { COMPLIANCE, FOUNDERS, OWNER, PILLARS, VALUES } from "@/website/features/about/content"
import { WARRANTY_DAYS } from "@/website/features/products/catalog"
import { ON_PHOTO } from "@/website/lib/hero"

const TRUST = [
  { icon: Gem, label: "Natural stones only" },
  { icon: Hand, label: "Handcrafted in India" },
  { icon: ReceiptText, label: "GST invoice on every order" },
  { icon: ShieldCheck, label: `${WARRANTY_DAYS}-day warranty` },
] as const

const STATS = [
  { value: "100%", label: "Natural gemstones" },
  { value: "1", label: "Honest price for all" },
  { value: `${WARRANTY_DAYS}-day`, label: "Defect warranty" },
] as const

export function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About VEDORA"
        title={
          <>
            A gemstone brand <br className="hidden sm:block" />
            built on <GoldWord sparkle>quality.</GoldWord>
          </>
        }
        description="VEDORA designs and sells premium natural gemstone bracelets. We make one thing carefully, price it honestly, and stand behind every piece."
        tone="portal"
        footer={
          <>
            <HeroChips items={TRUST} />
            <HeroStatCards stats={STATS} />
          </>
        }
        aside={
          <div className="relative mx-auto w-full max-w-[34rem]">
            {/* Gold frame peeking out behind the logo, as on the home page */}
            <div
              aria-hidden
              className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-2xl border border-gold/60"
            />
            <div className="relative overflow-hidden rounded-2xl border border-gold/30 shadow-2xl shadow-deep/30">
              <img
                src={logoImage}
                alt="VEDORA — Wear your energy"
                className="aspect-[3/2] w-full object-cover"
              />
              <span
                className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-deep/80 px-3 py-1 text-[0.6875rem] font-semibold backdrop-blur-md ${ON_PHOTO} text-gold-light`}
              >
                <Sparkles aria-hidden className="size-3" />
                Wear your energy
              </span>
            </div>
          </div>
        }
      />

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <InfoCard key={p.label} label={p.label} title={p.title} titleStyle="serif">
              {p.body}
            </InfoCard>
          ))}
        </div>
      </Section>

      <Section tone="cream" id="founders" className="scroll-mt-16">
        <SectionHeading kicker="Leadership" title="Owner & founders of VEDORA" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FounderCard founder={OWNER} />
          {FOUNDERS.map((f) => (
            <FounderCard key={f.id} founder={f} />
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading kicker="Our values" title="What we hold ourselves to" />
        <div className="grid gap-x-12 gap-y-8 rounded-2xl border border-border bg-card/50 p-6 sm:grid-cols-2 md:p-8">
          {VALUES.map((v, i) => (
            <div key={v.title}>
              <p className="font-mono text-[0.6875rem] text-gold">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-[0.9375rem] font-bold">{v.title}</h3>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        tone="forest"
        divided
        containerClassName="grid items-center gap-8 md:grid-cols-2 md:gap-14"
      >
        <div>
          <Kicker>Compliance</Kicker>
          <h2 className="mt-4 font-display text-[2rem] leading-tight font-normal md:text-[2.375rem]">
            Registered and accountable
          </h2>
        </div>
        <BulletList items={COMPLIANCE} className="text-[0.8125rem] text-foreground/85" />
      </Section>
    </>
  )
}
