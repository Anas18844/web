import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { home } from '@/content/copy'

/**
 * The only block about the founder on the home page.
 *
 * Kept deliberately short: the home page belongs to the student. Anyone who
 * wants the full picture follows the link to /about, where the credentials
 * and their screenshots live.
 *
 * Sitting directly under the hero, this is the recognition beat — so the three
 * numbers are given real scale and arrive one after another, which is what
 * makes a claim register as evidence rather than as a list.
 */
export function AboutTeaser() {
  return (
    <Section id="about-teaser" tone="raised">
      <div className="grid gap-9 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-12">
        <div data-reveal>
          <span aria-hidden="true" className="trace-rule mb-5" />
          <h2 className="text-title font-extrabold text-ink">{home.aboutTeaser.title}</h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">{home.aboutTeaser.body}</p>
          <ButtonLink href="/about" variant="secondary" className="mt-7">
            {home.aboutTeaser.cta}
          </ButtonLink>
        </div>

        <dl data-reveal-stagger className="grid gap-4">
          {home.aboutTeaser.stats.map((stat) => (
            <div key={stat.value} className="card card-lit bg-navy/30 px-5 py-4">
              <dt className="text-xl font-extrabold text-gold sm:text-2xl">{stat.value}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
