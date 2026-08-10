import { cn } from '@/lib/utils'

/**
 * The hero's arrival: the headline rises word by word out of clipped
 * line-boxes, then the lead, actions and trust conveyor follow as one block.
 *
 * Server component, on purpose. This headline is the LCP element — animating
 * it through a JS library would ship it hidden in the HTML and reveal it only
 * after hydration, which on a slow connection means seconds of blank title.
 * Pure CSS keeps the choreography (an overshoot curve stands in for the
 * spring) while the words exist, visible-by-default, in the first byte of
 * HTML: the `.js` gate hides them only when the animation is guaranteed to
 * run, and reduced motion collapses everything to the finished state.
 *
 * The motion library earns its keep elsewhere — on interactions that have no
 * SSR cost (see Magnetic.tsx).
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
  const words = title.split(' ')

  return (
    <>
      <p className="hero-enter mb-4 text-sm font-semibold leading-relaxed text-gold sm:mb-5">
        {eyebrow}
      </p>

      <h1 className="text-display font-extrabold text-ink">
        {/* Assistive tech reads the title as one sentence, not sixteen spans. */}
        <span className="sr-only">{title}</span>
        <span aria-hidden="true">
          {words.map((word, i) => (
            <span key={`${word}-${i}`} className={cn('inline-block overflow-hidden pb-1 align-bottom')}>
              <span
                className="hero-word inline-block"
                style={{ animationDelay: `${90 + i * 55}ms` }}
              >
                {word}
              </span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </span>
      </h1>

      <div className="hero-enter-late">{children}</div>
    </>
  )
}
