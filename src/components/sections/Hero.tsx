import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { Circuit } from '@/components/ui/Circuit'
import { HeroIntro } from '@/components/motion/HeroIntro'
import { Magnetic } from '@/components/motion/Magnetic'
import { home } from '@/content/copy'
import { assets } from '@/content/assets'

/**
 * Layer 1 — the immediate (Doc 07 §2).
 *
 * One promise, one action. The headline states exactly what the student gets
 * ("من الأساس لحد الدرجة النهائية") and the only button books a place. The
 * trust strip, the second button and the gold ambience were all removed in
 * August 2026 — three competing things in a hero is three ways to leave it.
 *
 * The headline paints as a gold outline and fills white in one sweep. That
 * entrance is pure CSS on the real <h1>, so the words exist, visible and
 * selectable, in the first byte of HTML. This is the LCP text, and animating it
 * through a JS library would ship it hidden until hydration.
 *
 * On wide screens the photograph drifts at about two-thirds the page's speed
 * through the first screenful (`.hero-media`), which separates the portrait
 * from the copy standing in front of it. Below `xl` the image is in the flow
 * rather than behind the text, so there are no planes to separate and the
 * parallax is switched off — it would only shift the crop.
 *
 * One <Image> serves both layouts: an in-flow band under `xl` (stacked, full
 * width) and a full background above it. The switch lives at `xl` because
 * `object-cover` crops harder as the viewport narrows — below 1280px the
 * portrait collides with the copy column, and no scrim fixes a collision.
 */
export function Hero() {
  const banner = assets.hero

  return (
    <section className="relative overflow-hidden border-b border-navy-line bg-navy-deep">
      {banner ? (
        <div className="hero-media relative aspect-[4/3] w-full sm:aspect-[16/9] md:aspect-[5/2] xl:absolute xl:inset-0 xl:aspect-auto xl:h-full">
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

      {/* The same live circuit that opens every inner page, brought home.
          The photograph already carries these traces as artwork on its right
          side; this is the drawn version of them, in the corner where the
          scrim is at its most opaque and there is nothing behind it to fight.
          It draws itself as the page opens and then carries the two pulses,
          so the motif the whole identity is built on is finally moving on the
          first screen a visitor sees.

          Desktop only. Below xl the hero is stacked — photograph on top, copy
          beneath on flat navy — and there is no corner for it to occupy that
          is not already someone's text. */}
      <div
        data-reveal
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 start-0 hidden opacity-40 xl:block"
      >
        <Circuit className="h-44 w-auto" />
      </div>

      <Container className="relative py-12 sm:py-16 xl:py-28">
        <div className="xl:max-w-[56%]">
          <HeroIntro eyebrow={home.hero.eyebrow} title={home.hero.title}>
            <p className="mt-5 max-w-prose text-subtitle text-ink-muted sm:mt-6">
              {home.hero.lead}
            </p>

            <div className="mt-8 sm:mt-10">
              {/* The single action leans toward the cursor — spring physics on
                  the one element the whole page is pointing at. */}
              <Magnetic>
                <ButtonLink href="/#start" data-cta="hero" className="px-8 text-lg">
                  {home.hero.primaryCta}
                </ButtonLink>
              </Magnetic>
            </div>
          </HeroIntro>
        </div>
      </Container>
    </section>
  )
}
