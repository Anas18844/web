import { Section, SectionHeading } from '@/components/ui/Section'
import { home } from '@/content/copy'

/**
 * Practical answers live in Layer 2, not in a distant FAQ (Doc 07 §2.4):
 * "where / how / what does it cost / when" are the questions that silently
 * kill the hesitation stage when left unanswered.
 *
 * Plain <details> — accessible, zero JS, works with JS disabled.
 */
export function Practical() {
  return (
    <Section id="practical">
      <SectionHeading title={home.practical.title} />

      <div className="divide-y divide-navy-line border-y border-navy-line">
        {home.practical.items.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-start text-lg font-bold text-ink marker:hidden">
              <span>{item.q}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-2xl font-normal text-gold transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-prose text-body text-ink-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
