import { Kicker } from "@/website/components/common/section"
import { Button } from "@/website/components/ui/button"
import { type Bracelet, stoneLine } from "@/website/features/products/catalog"
import { Price } from "@/website/features/products/components/price"
import { whatsappLink } from "@/website/lib/site"
import { cn } from "@/website/lib/utils"

type Props = {
  bracelet: Bracelet
  /** Put the image on the right (every other row). */
  reverse?: boolean
}

/** One bracelet on the products page: large image beside its description, details and actions. */
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
        <Kicker className="text-[0.625rem]">{bracelet.style}</Kicker>
        <h2 className="mt-3 font-display text-[2rem] leading-tight font-normal md:text-[2.375rem]">
          {bracelet.name}
        </h2>
        <p className="mt-4 text-[0.875rem] leading-relaxed text-muted-foreground">
          {bracelet.description}
        </p>

        <p className="mt-2 text-[0.75rem] text-muted-foreground">{stoneLine(bracelet)}</p>

        <dl className="mt-6 space-y-3 rounded-xl border border-border bg-card/60 p-4">
          {bracelet.details.map((d) => (
            <div key={d.label}>
              <dt className="text-[0.75rem] font-bold text-gold">{d.label}</dt>
              <dd className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {d.text}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-6">
          <Price className="font-display text-[1.75rem] leading-none text-foreground/90" />
          <Button asChild>
            <a
              href={whatsappLink(`Hi VEDORA, I'd like to know more about the ${bracelet.name}.`)}
              target="_blank"
              rel="noreferrer"
            >
              Enquire on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </article>
  )
}
