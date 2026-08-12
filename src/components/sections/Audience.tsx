import { Section, SectionHeading } from '@/components/ui/Section'
import { IconPlate, type IconName } from '@/components/ui/Icon'
import { home } from '@/content/copy'

/** One glyph per segment, in the copy's own order:
    school student → track student → university → self-learner. */
const AUDIENCE_ICONS: readonly IconName[] = ['book', 'branch', 'university', 'compass']

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
    <Section id="audience" tone="paperSoft">
      <SectionHeading title={home.audience.title} />

      <div data-reveal-stagger className="grid gap-5 sm:grid-cols-2">
        {home.audience.items.map((item, index) => (
          <article key={item.title} className="group/card card p-6 sm:p-7">
            <IconPlate
              name={AUDIENCE_ICONS[index] ?? 'spark'}
              className="mb-5 group-hover/card:border-gold/60 group-hover/card:bg-gold/[0.12]"
            />
            <h3 className="text-lg font-extrabold text-ink">{item.title}</h3>
            <p className="mt-3 text-body text-ink-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
