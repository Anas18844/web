import { Section, SectionHeading } from '@/components/ui/Section'
import { home } from '@/content/copy'

/**
 * Who this is for. We serve four segments, not one grade — school students
 * (1st/2nd secondary), university freshmen in CS/engineering, and self-learners.
 *
 * Placed early because a visitor who cannot find themselves on the page leaves
 * before any proof gets a chance to work. The cards arrive in sequence so the
 * eye is walked across all four instead of being handed a block of text: the
 * student has to reach their own row before they can recognise it.
 */
export function Audience() {
  return (
    <Section id="audience">
      <SectionHeading title={home.audience.title} />

      <div data-reveal-stagger className="grid gap-5 sm:grid-cols-2">
        {home.audience.items.map((item) => (
          <article key={item.title} className="card p-6 sm:p-7">
            <h3 className="text-lg font-extrabold text-ink">{item.title}</h3>
            <p className="mt-3 text-body text-ink-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
