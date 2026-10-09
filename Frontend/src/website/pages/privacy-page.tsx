import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { BulletList } from "@/website/components/common/bullet-list"
import { CtaPanel } from "@/website/components/common/cta-panel"
import { PageHero } from "@/website/components/common/page-hero"
import { Section } from "@/website/components/common/section"
import { Button } from "@/website/components/ui/button"
import { PRIVACY_POLICY } from "@/website/features/legal/privacy-policy"
import { SITE } from "@/website/lib/site"

const num = (i: number) => String(i + 1).padStart(2, "0")

export function PrivacyPage() {
  return (
    <>
      <PageHero
        kicker="Legal"
        title="Privacy Policy"
        description="How VEDORA collects, uses, stores and protects customer and partner data."
      />

      <Section containerClassName="grid items-start gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <nav
          aria-label="On this page"
          className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24"
        >
          <p className="text-[0.625rem] font-bold tracking-[0.18em] text-gold uppercase">
            On this page
          </p>
          <ol className="mt-4 space-y-2.5">
            {PRIVACY_POLICY.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-[0.75rem] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {num(i)} · {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl">
          {PRIVACY_POLICY.map((s, i) => (
            <section key={s.id} id={s.id} className="border-b border-border py-8 first:pt-0">
              <h2 className="flex items-baseline gap-3 font-display text-[1.75rem] leading-tight font-normal">
                <span className="font-mono text-[0.6875rem] text-gold">{num(i)}</span>
                {s.title}
              </h2>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-muted-foreground">{s.body}</p>
              {s.list ? (
                <BulletList items={s.list} className="mt-4 text-[0.8125rem] text-foreground/85" />
              ) : null}
            </section>
          ))}

          <CtaPanel
            size="compact"
            className="mt-10"
            title="Questions about your data?"
            description={`${SITE.email} · Mon–Sat, 10:00–18:00 IST`}
            actions={
              <Button asChild>
                <Link to={ROUTES.contact}>Contact support</Link>
              </Button>
            }
          />
        </div>
      </Section>
    </>
  )
}
