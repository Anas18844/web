import { Section } from '@/components/ui/Section'
import { home } from '@/content/copy'

/**
 * The graduation promise — the one moment on the page that speaks in the
 * founder's own voice rather than about the system.
 *
 * Held to a single centred statement on purpose. It follows six cards of
 * mechanism, and the contrast is the point: after all that machinery, one
 * sentence about what the student walks away with.
 */
export function Outcome() {
  return (
    <Section tone="raised" space="sm" width="prose" className="text-center">
      <div data-reveal>
        <span aria-hidden="true" className="trace-rule mx-auto mb-6 origin-center" />
        <h2 className="text-title font-extrabold text-ink">{home.outcome.title}</h2>
        <p className="mx-auto mt-5 max-w-prose text-subtitle text-ink-muted">
          {home.outcome.body}
        </p>
        <p className="mx-auto mt-7 border-t border-navy-line pt-6 text-sm font-bold text-gold">
          {home.outcome.signature}
        </p>
      </div>
    </Section>
  )
}
