import logo from "@/assets/images/vedora-logo.jpg"

/** Left half of the sign-in screens: the VEDORA logo and tagline. */
export function AuthBrandPanel() {
  return (
    <section className="relative flex flex-col justify-center gap-6 bg-[radial-gradient(ellipse_at_30%_20%,var(--secondary)_0%,transparent_70%)] py-8 safe-x md:px-10 lg:px-14 lg:py-12">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-gold/15 shadow-[0_24px_60px_-20px_var(--shadow-color)]">
        <img
          src={logo}
          alt="VEDORA — Wear Your Energy"
          className="aspect-[3/2] w-full object-cover"
          width={1400}
          height={933}
        />
      </div>
      <div className="mx-auto w-full max-w-xl">
        <h2 className="font-display text-4xl font-normal md:text-5xl">Wear Your Energy</h2>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Natural gemstone bracelets, built into a direct-selling business you own.
        </p>
      </div>
    </section>
  )
}
