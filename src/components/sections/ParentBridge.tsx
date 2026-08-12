import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { home } from '@/content/copy'

/**
 * The student→parent bridge (Doc 01 §2.1). The student is the one who has to
 * convince the household; this hands them the page written in their parent's
 * language, so the two audiences never share a tone (Principle 11).
 *
 * Title and button only. The description was removed in August 2026 — this is
 * a signpost, and a signpost that explains the destination is doing the
 * destination's job. /parents does the explaining.
 */
export function ParentBridge() {
  return (
    <Section tone="paper" space="sm">
      <div
        data-reveal
        className="card card-lit flex flex-col items-start gap-6 bg-card p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9"
      >
        <h2 className="text-xl font-extrabold text-ink sm:text-2xl">
          {home.parentBridge.title}
        </h2>
        <ButtonLink href="/parents" variant="secondary" className="shrink-0">
          {home.parentBridge.cta}
        </ButtonLink>
      </div>
    </Section>
  )
}
