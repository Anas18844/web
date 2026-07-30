import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { home } from '@/content/copy'
import { site, institutions } from '@/content/site'
import { assets } from '@/content/assets'

/**
 * Layer 1 — the immediate (Doc 07 §2).
 *
 * The banner carries the founder's face on the left and the brand circuit
 * motif on the right, so the visitor arriving from a video recognises the
 * place instantly. The trust strip underneath answers "why listen to him?"
 * with places rather than a job title — the founder's core correction.
 *
 * One <Image> serves both breakpoints: an in-flow band on mobile (cropped to
 * the portrait) and a full background on desktop. Never two downloads.
 */
export function Hero() {
  const banner = assets.hero
  const trustNames = [
    ...institutions.teaching.map((i) => i.name),
    ...institutions.industry.map((i) => i.name),
  ].filter((name, index, all) => all.indexOf(name) === index)

  return (
    <section className="relative overflow-hidden border-b border-navy-line bg-navy-deep">
      {banner ? (
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] md:absolute md:inset-0 md:aspect-auto md:h-full">
          <Image
            src={banner.src}
            alt={banner.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-left md:object-center"
          />
          {/* Mobile: fade the band into the section. Desktop (RTL): dim the
              right half so the copy is readable over the circuit motif. */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/45 to-transparent md:bg-gradient-to-l md:from-navy-deep md:via-navy-deep/85 md:to-transparent" />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to left, #CBA352 1px, transparent 1px), linear-gradient(to bottom, #CBA352 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      )}

      <Container className="relative py-12 sm:py-16 md:py-24">
        <div className="md:max-w-[56%]">
          <p className="mb-4 text-sm font-semibold leading-relaxed text-gold sm:mb-5">
            {home.hero.eyebrow}
          </p>

          <h1 className="text-display font-extrabold text-ink">{home.hero.title}</h1>

          <p className="mt-5 max-w-prose text-subtitle text-ink-muted sm:mt-6">
            {home.hero.lead}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 sm:mt-9">
            <ButtonLink href="/#start">{home.hero.primaryCta}</ButtonLink>
            <ButtonLink href="/courses" variant="secondary">
              {home.hero.secondaryCta}
            </ButtonLink>
          </div>

          {/* Trust strip: recognisable places, not a job title. */}
          <div className="mt-9 border-t border-navy-line/70 pt-6">
            <p className="text-xs font-semibold tracking-wide text-ink-faint">
              {home.hero.trustLabel}
            </p>
            <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              {trustNames.map((name) => (
                <li key={name} className="text-sm font-bold text-ink-muted">
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 inline-block border-s-2 border-gold ps-4 text-lg font-bold text-ink">
            {site.motto}
          </p>
        </div>
      </Container>
    </section>
  )
}
