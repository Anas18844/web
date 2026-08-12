import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { CountUp } from '@/components/motion/CountUp'
import { home } from '@/content/copy'

/**
 * The only block about the founder on the home page.
 *
 * Kept deliberately short: the home page belongs to the student. Anyone who
 * wants the full picture follows the link to /about, where the credentials
 * and their screenshots live.
 *
 * Sitting directly under the hero, this is the recognition beat — so the
 * numbers do not just sit there, they count themselves up as they enter the
 * viewport. A figure that moves is a figure that gets read.
 */

/**
 * Splits a stat value like «+٢٠ منتج» into the digits and what surrounds
 * them, so the digits can animate while the copy string itself stays exactly
 * as written in copy.ts. Values with no digits (like «Expert») pass through
 * untouched.
 */
function AnimatedValue({ value, className }: { value: string; className?: string }) {
  const match = value.match(/([٠-٩0-9]+)/)
  if (!match || match.index === undefined) {
    return <span className={className}>{value}</span>
  }

  const digits = match[1]
  const numeric = Number(
    digits.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))),
  )

  return (
    <CountUp
      value={numeric}
      prefix={value.slice(0, match.index)}
      suffix={value.slice(match.index + digits.length)}
      className={className}
    />
  )
}

export function AboutTeaser() {
  return (
    <Section id="about-teaser" tone="paper">
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
            <div key={stat.value} className="card card-lit bg-card px-5 py-4">
              <dt className="text-xl font-extrabold text-gold sm:text-2xl">
                <AnimatedValue value={stat.value} />
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
