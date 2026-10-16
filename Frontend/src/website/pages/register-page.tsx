import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { PageHero } from "@/website/components/common/page-hero"
import { Section } from "@/website/components/common/section"
import { PartnerInterestForm } from "@/website/features/enquiries/components/partner-interest-form"

/** Partner registration only — the interest form and a link to sign in. Not linked from the site. */
export function RegisterPage() {
  return (
    <>
      <PageHero
        kicker="Partner registration"
        title="Register your interest"
        description="Share your details and our team will call you to complete your registration. Have a sponsor? Add their VEDORA ID."
      />

      <Section containerClassName="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
            You join under a sponsor with your PAN and details and accept the Partner Agreement. Our
            team will guide you through each step.
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
