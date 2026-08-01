import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
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
 * One <Image> serves both breakpoints: an in-flow band on mobile (cropped to
 * the portrait) and a full background on desktop. Never two downloads.
 *
 * The switch happens at `xl`, and the reason is geometric rather than
 * arbitrary. `object-cover` scales the banner to whichever axis is short, so
 * the narrower the viewport the TALLER the hero is relative to its width, the
 * harder the banner is cropped, and the further the portrait is pushed into
 * the copy column. Below 1280px he collides with the headline, and no scrim
 * fixes a collision — it only hides him behind a dark panel. So everything
 * under `xl` stacks: the photograph gets the full width, then the words do.
 *
 * `object-left-top` serves both crops. On the narrow bands the scale is
 * height-driven, so the horizontal anchor is what keeps him in frame; on the
 * wide banner bands it is width-driven, and the top anchor is what keeps his
 * head from being cut off.
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

      <Container className="relative py-12 sm:py-16 xl:py-28">
        {/*
         * The entrance is two groups, not seven elements: the message lands,
         * then the things you can act on follow it. Anything more granular
         * turns an arrival into a queue.
         *
         * The photograph above is deliberately excluded — it is the largest
         * paint on the page, and fading it in would push LCP back on every
         * single visit for no gain the visitor can perceive.
         */}
        <div className="xl:max-w-[56%]">
          <div className="hero-enter">
            <p className="mb-4 text-sm font-semibold leading-relaxed text-gold sm:mb-5">
              {home.hero.eyebrow}
            </p>

            <h1 className="text-display font-extrabold text-ink">{home.hero.title}</h1>

            <p className="mt-5 max-w-prose text-subtitle text-ink-muted sm:mt-6">
              {home.hero.lead}
            </p>
          </div>

          <div className="hero-enter-late">
            <div className="mt-8 flex flex-wrap gap-3 sm:mt-9">
              <ButtonLink href="/#start">{home.hero.primaryCta}</ButtonLink>
              <ButtonLink href="/courses" variant="secondary">
                {home.hero.secondaryCta}
              </ButtonLink>
            </div>

            {/* Trust strip: recognisable places, not a job title.
                Deliberately NOT separated by rules — the row wraps at several
                widths, and any per-item divider ends up orphaned at the start
                of a wrapped line. Space does the same job and never breaks. */}
            <div className="mt-9 border-t border-navy-line/70 pt-6">
              <p className="text-xs font-semibold tracking-wide text-ink-faint">
                {home.hero.trustLabel}
              </p>
              <ul className="mt-3.5 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                {trustNames.map((name) => (
                  <li key={name} className="text-sm font-bold tracking-wide text-ink-muted">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
