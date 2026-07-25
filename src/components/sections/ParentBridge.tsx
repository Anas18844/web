import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { home } from '@/content/copy'

/**
 * The student→parent bridge (Doc 01 §2.1). The student is the one who has to
 * convince the household; this hands them the page written in their parent's
 * language, so the two audiences never share a tone (Principle 11).
 */
export function ParentBridge() {
  return (
    <Section tone="raised">
      <div className="flex flex-col items-start gap-6 border border-navy-line p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div>
          <h2 className="text-xl font-extrabold text-ink sm:text-2xl">
            {home.parentBridge.title}
          </h2>
          <p className="mt-3 max-w-prose text-body text-ink-muted">{home.parentBridge.body}</p>
        </div>
        <ButtonLink href="/parents" variant="secondary" className="shrink-0">
          {home.parentBridge.cta}
        </ButtonLink>
      </div>
    </Section>
  )
}
