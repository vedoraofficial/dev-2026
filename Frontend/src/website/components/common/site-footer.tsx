import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { FOOTER_EXPLORE, FOOTER_LEGAL } from "@/website/app/navigation"
import { ROUTES } from "@/website/app/routes"
import { Container } from "@/website/components/common/container"
import { Logo } from "@/website/components/common/logo"
import { DIRECT_SELLING_DISCLAIMER, SITE } from "@/website/lib/site"

const linkClass = "text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground"

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-gold uppercase">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  )
}

/** Site footer: brand blurb, link columns, contact, direct-selling disclaimer. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-deep">
      <Container className="py-14 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link to={ROUTES.home} aria-label="VEDORA home" className="inline-block">
              <Logo tagline={false} />
            </Link>
            <p className="mt-4 max-w-[16rem] text-[0.8125rem] leading-relaxed text-muted-foreground">
              Premium natural gemstone bracelets, handcrafted for everyday wear. More than a
              bracelet — a better you.
            </p>
          </div>

          <FooterColumn title="Explore">
            {FOOTER_EXPLORE.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={ROUTES.portalLogin}
                className="text-[0.8125rem] text-gold hover:text-gold-light"
              >
                Partner Login →
              </Link>
            </li>
          </FooterColumn>

          <FooterColumn title="Legal">
            {FOOTER_LEGAL.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Reach us">
            <li>
              <a href={`mailto:${SITE.email}`} className={linkClass}>
                {SITE.email}
              </a>
            </li>
            <li>
              <a href={`https://${SITE.website}`} className={linkClass}>
                {SITE.website}
              </a>
            </li>
            <li className="text-[0.8125rem] text-muted-foreground">{SITE.hours}</li>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-start md:justify-between">
          <p className="max-w-3xl text-[0.6875rem] leading-relaxed text-muted-foreground/80">
            {DIRECT_SELLING_DISCLAIMER}
          </p>
          <p className="shrink-0 text-[0.6875rem] text-muted-foreground/80">
            © {SITE.year} VEDORA. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
