import logoImage from "@/assets/images/vedora-logo.jpg"
import { BulletList } from "@/website/components/common/bullet-list"
import { InfoCard } from "@/website/components/common/info-card"
import { PageHero } from "@/website/components/common/page-hero"
import { Kicker, Section, SectionHeading } from "@/website/components/common/section"
import { FounderCard } from "@/website/features/about/components/founder-card"
import { COMPLIANCE, FOUNDERS, PILLARS, VALUES } from "@/website/features/about/content"

export function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About VEDORA"
        title="A gemstone brand with a business built in."
        description="VEDORA designs and sells premium natural gemstone bracelets through a network of independent partners. We make one thing carefully, price it honestly, and reward the people who share it."
        aside={
          <div className="overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/50">
            <img
              src={logoImage}
              alt="VEDORA — Wear your energy"
              className="aspect-[5/3] w-full object-cover"
            />
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
        <SectionHeading
          kicker="Leadership"
          title="The founders of VEDORA"
          aside={
            <p className="text-[0.8125rem] leading-relaxed font-semibold text-foreground/80">
              Three founders hold the first three VEDORA IDs — permanently, at the top of the
              network.
            </p>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
