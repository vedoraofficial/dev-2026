import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
  Timer,
} from "lucide-react"
import type { ReactNode } from "react"

import { GoldDiamond } from "@/website/components/common/gold-diamond"
import { GoldWord } from "@/website/components/common/gold-word"
import { HeroChips, PageHero } from "@/website/components/common/page-hero"
import { Kicker, Section, SectionHeading } from "@/website/components/common/section"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/website/components/ui/accordion"
import { Button } from "@/website/components/ui/button"
import { ContactForm } from "@/website/features/enquiries/components/contact-form"
import { FAQS, GRIEVANCE_CHECKLIST, RESOLUTION_TIMELINES } from "@/website/features/support/content"
import { HERO_CARD } from "@/website/lib/hero"
import { SITE, whatsappLink } from "@/website/lib/site"
import { cn } from "@/website/lib/utils"

const TEL = `tel:${SITE.phone.replace(/s/g, "")}`

const TRUST = [
  { icon: Timer, label: "Replies within published timelines" },
  { icon: ShieldCheck, label: "Named Grievance Officer" },
  { icon: ReceiptText, label: "Help with orders & invoices" },
] as const

/** Quick ways to reach us, shown as glass cards in the hero. */
const REACH = [
  { icon: Phone, label: "Call us", value: SITE.phone, href: TEL },
  { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
  { icon: Clock, label: "Hours", value: SITE.hours },
  { icon: MapPin, label: "Based in", value: "Badlapur, Thane, Maharashtra" },
] as const

function DetailRow({
  label,
  value,
  strong = true,
}: {
  label: string
  value: ReactNode
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-[0.8125rem]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right", strong ? "font-bold" : "text-muted-foreground")}>
        {value}
      </span>
    </div>
  )
}

function SupportCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <p className="text-[0.625rem] font-bold tracking-[0.18em] text-gold uppercase">
        Official support
      </p>
      <div className="mt-3">
        <DetailRow label="Legal name" value={SITE.legalName} />
        <DetailRow
          label="Phone"
          value={<a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>}
        />
        <DetailRow label="Email" value={<a href={`mailto:${SITE.email}`}>{SITE.email}</a>} />
        <DetailRow label="Website" value={<a href={`https://${SITE.website}`}>{SITE.website}</a>} />
        <DetailRow label="Hours" value={SITE.hours} />
        <DetailRow label="Address" value={SITE.address} strong={false} />
      </div>
      <Button variant="whatsapp" size="lg" className="mt-4 w-full" asChild>
        <a href={whatsappLink("Hi VEDORA, I need help with…")} target="_blank" rel="noreferrer">
          Chat on WhatsApp
        </a>
      </Button>
    </div>
  )
}

function TimelinesCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <p className="text-[0.625rem] font-bold tracking-[0.18em] text-gold uppercase">
        We resolve within
      </p>
      <ul className="mt-3 divide-y divide-border">
        {RESOLUTION_TIMELINES.map((t) => (
          <li key={t.topic} className="flex justify-between gap-4 py-3 text-[0.8125rem]">
            <span className="text-foreground/85">{t.topic}</span>
            <span className="font-bold text-gold">{t.time}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Contact & support"
        title={
          <>
            We&apos;re here <br className="hidden sm:block" />
            to <GoldWord sparkle>help.</GoldWord>
          </>
        }
        description="Questions about a bracelet, an order or your partner account — write to us and we'll respond within published timelines."
        tone="portal"
        actions={
          <>
            <Button size="lg" asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
              <a
                href={whatsappLink("Hi VEDORA, I need help with…")}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle aria-hidden data-icon="inline-start" />
                Chat on WhatsApp
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={TEL}>
                <Phone aria-hidden data-icon="inline-start" />
                Call us
              </a>
            </Button>
          </>
        }
        footer={<HeroChips items={TRUST} />}
        aside={
          <ul className="mx-auto grid w-full max-w-[34rem] gap-3 sm:grid-cols-2">
            {REACH.map(({ icon: Icon, label, value, ...rest }) => {
              const href = "href" in rest ? rest.href : undefined
              const body = (
                <>
                  <span className="grid size-9 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold-light">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <p className="mt-4 text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-[0.875rem] font-semibold break-words">{value}</p>
                </>
              )
              return (
                <li key={label}>
                  {href ? (
                    <a
                      href={href}
                      className={`block h-full rounded-xl p-4 transition-colors hover:border-gold/60 md:p-5 ${HERO_CARD}`}
                    >
                      {body}
                    </a>
                  ) : (
                    <div className={`h-full rounded-xl p-4 md:p-5 ${HERO_CARD}`}>{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        }
      />

      <Section containerClassName="grid items-start gap-5 lg:grid-cols-2">
        <ContactForm />
        <div className="grid gap-5">
          <SupportCard />
          <TimelinesCard />
        </div>
      </Section>

      <Section
        tone="cream"
        id="grievance"
        containerClassName="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
      >
        <div>
          <Kicker>Grievance redressal</Kicker>
          <h2 className="mt-4 font-display text-[2.25rem] leading-[1.1] font-normal md:text-[2.75rem]">
            Unresolved? Escalate to
            <br className="hidden sm:block" /> our Grievance Officer.
          </h2>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
            As required for direct selling entities in India, VEDORA maintains a named Grievance
            Officer. If your complaint isn't resolved within the timelines above, write to the same
            support email marked “Grievance Escalation”.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="border-b border-border pb-3">
            <DetailRow label="Grievance Officer" value={SITE.grievanceOfficer} />
            <DetailRow
              label="Email"
              value={
                <a href={`mailto:${SITE.email}?subject=Grievance%20Escalation`}>{SITE.email}</a>
              }
            />
          </div>
          <p className="mt-4 text-[0.8125rem] font-bold">Please include</p>
          <ul className="mt-3 space-y-2">
            {GRIEVANCE_CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-3 text-[0.75rem]">
                <GoldDiamond />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section containerClassName="max-w-3xl">
        <SectionHeading kicker="FAQ" title="Common questions" align="center" />
        <Accordion type="single" collapsible defaultValue={FAQS[0].q} className="border-t">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>
    </>
  )
}
