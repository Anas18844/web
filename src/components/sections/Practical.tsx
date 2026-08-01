import { Section, SectionHeading } from '@/components/ui/Section'
import { home } from '@/content/copy'

/**
 * Practical answers live in Layer 2, not in a distant FAQ (Doc 07 §2.4):
 * "where / how / what does it cost / when" are the questions that silently
 * kill the hesitation stage when left unanswered.
 *
 * Plain <details> — accessible, zero JS, works with JS disabled. The answer
 * rises into place instead of snapping, and an open row carries the same gold
 * trace the cards use, so "this one is open" is legible from across the page.
 */
export function Practical() {
  return (
    <Section id="practical">
      <SectionHeading title={home.practical.title} />

      <div data-reveal-stagger className="border-y border-navy-line">
        {home.practical.items.map((item) => (
          <details
            key={item.q}
            className="group relative border-b border-navy-line last:border-b-0"
          >
            {/* Lit only while the row is open — the trace marks state, not decoration. */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 start-0 w-0.5 origin-top scale-y-0 bg-gold transition-transform duration-300 ease-out group-open:scale-y-100"
            />
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-1 py-5 text-start text-lg font-bold text-ink transition-colors duration-200 marker:hidden hover:text-gold group-open:text-gold sm:px-4">
              <span>{item.q}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-2xl font-normal leading-none text-gold transition-transform duration-300 ease-out group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="disclosure-panel max-w-prose px-1 pb-6 text-body text-ink-muted sm:px-4">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </Section>
  )
}
