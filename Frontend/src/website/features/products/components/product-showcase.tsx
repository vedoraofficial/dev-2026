import { Link } from "react-router-dom"

import { ROUTES } from "@/website/app/routes"
import { GoldDiamond } from "@/website/components/common/gold-diamond"
import { Kicker } from "@/website/components/common/section"
import { Button } from "@/website/components/ui/button"
import { BRACELET_PRICE, type Bracelet, type Gemstone } from "@/website/features/products/catalog"
import { formatINR } from "@/website/lib/format"
import { whatsappLink } from "@/website/lib/site"
import { cn } from "@/website/lib/utils"

function StoneCard({ stone }: { stone: Gemstone }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3.5">
      <p className="text-[0.75rem] font-bold text-gold">{stone.name}</p>
      <ul className="mt-2.5 space-y-1.5">
        {stone.benefits.map((b) => (
          <li
            key={b}
            className="flex items-baseline gap-2 text-[0.6875rem] leading-snug text-muted-foreground"
          >
            <GoldDiamond className="size-1" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

type Props = {
  bracelet: Bracelet
  /** Put the image on the right (every other row). */
  reverse?: boolean
}

/** One bracelet on the products page: large image beside its story, stones and actions. */
export function ProductShowcase({ bracelet, reverse = false }: Props) {
  return (
    <article
      id={bracelet.slug}
      className="grid scroll-mt-24 items-center gap-8 md:grid-cols-2 lg:gap-12"
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/40",
          reverse && "md:order-2",
        )}
      >
        <img
          src={bracelet.image}
          alt={bracelet.name}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      </div>

      <div>
        <Kicker className="text-[0.625rem]">{bracelet.intention}</Kicker>
        <h2 className="mt-3 font-display text-[2rem] leading-tight font-normal md:text-[2.375rem]">
          {bracelet.name}
        </h2>
        <p className="mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
          {bracelet.description}
        </p>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
          {bracelet.stones.map((s) => (
            <StoneCard key={s.name} stone={s} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-6">
          <span className="font-display text-[1.75rem] leading-none text-foreground/90">
            {formatINR(BRACELET_PRICE)}
          </span>
          <Button asChild>
            <a
              href={whatsappLink(`Hi VEDORA, I'd like to know more about the ${bracelet.name}.`)}
              target="_blank"
              rel="noreferrer"
            >
              Enquire on WhatsApp
            </a>
          </Button>
          <Button variant="link" className="px-0" asChild>
            <Link to={ROUTES.business}>Sell this as a partner →</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
