import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'
import { privacy } from '@/content/copy'

export const metadata: Metadata = {
  title: privacy.meta.title,
  description: privacy.meta.description,
  alternates: { canonical: '/privacy' },
  robots: { index: false, follow: true },
}

/**
 * Written for humans, in plain Arabic — the policy must match what the system
 * actually does, word for word (Principle 31).
 */
export default function PrivacyPage() {
  return (
    <Section width="prose">
      <h1 className="text-display font-extrabold text-ink">{privacy.title}</h1>
      <p className="mt-3 text-sm text-ink-faint">{privacy.updated}</p>

      <div className="mt-10 grid gap-8">
        {privacy.sections.map((section) => (
          <article key={section.title}>
            <h2 className="text-lg font-extrabold text-ink">{section.title}</h2>
            <p className="mt-2 text-body text-ink-muted">{section.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
