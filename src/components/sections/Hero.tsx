import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
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
 * The headline rises word by word on load; that entrance is pure CSS so the
 * words exist, visible, in the first byte of HTML. This is the LCP text, and
 * animating it through a JS library would ship it hidden until hydration.
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
                <ButtonLink href="/#start" className="px-8 text-lg">
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
