/**
 * The hero's opening moment.
 *
 * The headline paints as a gold outline and fills white in a single sweep from
 * the right — the same direction every trace on this site grows in, and the
 * direction Arabic is read in. The treatment is `.hero-stroke` in globals.css:
 * pure CSS on the real <h1>, no split, no SVG, no library.
 *
 * That last part is the design constraint, not an implementation detail. The
 * usual way to build this effect renders one <tspan> per character, which
 * breaks the cursive joins Arabic depends on — «هفهمك» comes apart into five
 * disconnected letterforms in the wrong shapes. Keeping the heading intact is
 * also what keeps it a heading: one <h1> in the outline, selectable, readable
 * by a screen reader, and present in the first byte of HTML.
 *
 * Server component. This is the LCP text; nothing about it may wait for
 * hydration, so the entrance is CSS or it does not happen.
 */
export function HeroIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <>
      <p className="hero-enter mb-4 text-sm font-semibold leading-relaxed text-gold sm:mb-5">
        {eyebrow}
      </p>

      <h1 className="hero-stroke text-display font-extrabold text-ink">{title}</h1>

      <div className="hero-enter-late">{children}</div>
    </>
  )
}
