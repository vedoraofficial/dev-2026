import leavesImage from "@/assets/images/leaves.svg"

/**
 * Background of the page heroes, in the portal's look: leafy branches in the top-right and
 * bottom-right corners, soft gold light and fine diagonal lines. Put it first inside a
 * `relative overflow-hidden` band that uses `HERO_BAND`.
 */
export function HeroBackdrop() {
  return (
    <>
      <img
        src={leavesImage}
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 w-[min(32rem,60vw)] opacity-60 select-none"
      />
      <img
        src={leavesImage}
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 w-[min(18rem,45vw)] -scale-y-100 opacity-40 select-none"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 size-[30rem] rounded-full bg-gold/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 -bottom-48 size-[34rem] rounded-full bg-gold/15 blur-3xl"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 hero-lines" />
    </>
  )
}
