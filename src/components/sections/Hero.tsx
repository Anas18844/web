import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { Marquee } from '@/components/ui/Marquee'
import { HeroIntro } from '@/components/motion/HeroIntro'
import { Magnetic } from '@/components/motion/Magnetic'
import { home } from '@/content/copy'
import { institutions } from '@/content/site'
import { assets } from '@/content/assets'

/**
 * Layer 1 — the immediate (Doc 07 §2).
 *
 * The banner carries the founder's face on the left and the brand circuit
 * motif on the right, so the visitor arriving from a video recognises the
 * place instantly. The trust strip underneath answers "why listen to him?"
 * with places rather than a job title — the founder's core correction.
 *
 * The entrance is the site's one full choreography: the headline rises word
 * by word on springs, then the lead, actions and trust conveyor arrive as a
 * block. The photograph is deliberately excluded from all of it — it is the
 * LCP element, and fading it would delay the largest paint on every visit.
 *
 * One <Image> serves both layouts: an in-flow band under `xl` (stacked, full
 * width) and a full background above it. The switch lives at `xl` because
 * `object-cover` crops harder as the viewport narrows — below 1280px the
 * portrait collides with the copy column, and no scrim fixes a collision.
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
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] md:aspect-[5/2] xl:absolute xl:inset-0 xl:aspect-auto xl:h-full">
          <Image
            src={banner.src}
            alt={banner.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-left-top xl:object-left"
          />
          {/* Stacked (under xl): fade the band's bottom edge into the section
              so the photograph hands off to the copy instead of ending on a
              hard line. Banner (xl+, RTL): dim the right side so the copy is
              readable over the circuit motif — the stops are placed so the
              scrim is fully clear before it reaches the portrait on the left,
              which must stay undimmed. */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/45 to-transparent xl:bg-gradient-to-l xl:from-navy-deep xl:from-30% xl:via-navy-deep/85 xl:via-55% xl:to-transparent xl:to-75%" />
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

      {/* The living atmosphere. Sits above the banner's scrim and below the
          copy, so the drift reads as depth behind the words — never on them. */}
      <div aria-hidden="true" className="aurora absolute inset-0" />

      <Container className="relative py-12 sm:py-16 xl:py-28">
        <div className="xl:max-w-[56%]">
          <HeroIntro eyebrow={home.hero.eyebrow} title={home.hero.title}>
            <p className="mt-5 max-w-prose text-subtitle text-ink-muted sm:mt-6">
              {home.hero.lead}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
              {/* The primary action leans toward the cursor — spring physics
                  from the motion library, on the one element that deserves
                  the site's strongest pull. */}
              <Magnetic>
                <ButtonLink href="/#start">{home.hero.primaryCta}</ButtonLink>
              </Magnetic>
              <ButtonLink href="/courses" variant="secondary">
                {home.hero.secondaryCta}
              </ButtonLink>
            </div>

            {/* Trust conveyor: recognisable places in slow motion. A moving
                row holds the eye longer than a static list, and the loop
                means no name is ever the one that got cut by the fold. */}
            <div className="mt-9 border-t border-navy-line/70 pt-6">
              <p className="text-xs font-semibold tracking-wide text-ink-faint">
                {home.hero.trustLabel}
              </p>
              <Marquee className="mt-4" itemClassName="text-sm font-bold tracking-wide text-ink-muted">
                {trustNames}
              </Marquee>
            </div>
          </HeroIntro>
        </div>
      </Container>
    </section>
  )
}
