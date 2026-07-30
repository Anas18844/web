import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { home } from '@/content/copy'

/**
 * The only block about the founder on the home page.
 *
 * Kept deliberately short: the home page belongs to the student. Anyone who
 * wants the full picture follows the link to /about, where the credentials
 * and their screenshots live.
 */
export function AboutTeaser() {
  return (
    <Section id="about-teaser" tone="raised">
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <h2 className="text-title font-extrabold text-ink">{home.aboutTeaser.title}</h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">{home.aboutTeaser.body}</p>
          <ButtonLink href="/about" variant="secondary" className="mt-7">
            {home.aboutTeaser.cta}
          </ButtonLink>
        </div>

        <dl className="grid gap-5">
          {home.aboutTeaser.stats.map((stat) => (
            <div key={stat.value} className="border-s-2 border-gold/60 ps-4">
              <dt className="text-xl font-extrabold text-gold">{stat.value}</dt>
              <dd className="mt-1 text-sm text-ink-muted">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
