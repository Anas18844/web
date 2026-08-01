import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { home } from '@/content/copy'

/**
 * The free-first model on the home page.
 *
 * This answers the loudest unasked question ("what will this cost me?") with
 * "mostly nothing" — which is both true and the strongest trust move available
 * (Principle 5: help before you sell). Kept short; the detail lives on /courses.
 *
 * The four items are given a lit gold edge rather than a hover state: they are
 * a statement of what you already get, not four things to explore.
 */
export function FreeFirst() {
  return (
    <Section id="free" tone="deep">
      <div className="grid gap-9 md:grid-cols-[1.25fr_1fr] md:items-center md:gap-12">
        <div data-reveal>
          <span aria-hidden="true" className="trace-rule mb-5" />
          <h2 className="text-title font-extrabold text-ink">{home.freeTeaser.title}</h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">{home.freeTeaser.body}</p>
          <ButtonLink href="/courses" variant="secondary" className="mt-7">
            {home.freeTeaser.cta}
          </ButtonLink>
        </div>

        <ul data-reveal-stagger className="grid grid-cols-2 gap-3">
          {home.freeTeaser.items.map((item) => (
            <li
              key={item}
              className="card card-lit flex items-center gap-2.5 bg-navy/40 px-4 py-3.5 text-sm font-bold text-ink"
            >
              <span aria-hidden="true" className="text-gold">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
