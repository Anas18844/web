import { Section } from '@/components/ui/Section'
import { home } from '@/content/copy'

/**
 * Structural proof that requires no assets at all (Doc 04 §2 — ranks 3).
 * Specificity is the evidence here: nobody invents details this exact.
 */
export function Numbers() {
  return (
    <Section tone="raised" className="py-10 sm:py-14">
      <h2 className="sr-only">{home.numbers.title}</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {home.numbers.items.map((item) => (
          <div key={item.value}>
            <dt className="text-2xl font-extrabold text-gold sm:text-3xl">{item.value}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{item.label}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
