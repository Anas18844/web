import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { home } from '@/content/copy'
import { site } from '@/content/site'
import { assets } from '@/content/assets'

/**
 * Layer 1 — the immediate (Doc 07 §2).
 * Four elements only: identity, differentiation, a proof anchor, and a compass.
 * No price, no system detail, no form. It buys the first ten seconds.
 */
export function Hero() {
  const portrait = assets.founderPortrait

  return (
    <section className="relative overflow-hidden border-b border-navy-line bg-navy-deep">
      {/* Restrained circuit-line motif from the brand identity — decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to left, #CBA352 1px, transparent 1px), linear-gradient(to bottom, #CBA352 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <Container className="relative py-16 sm:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="mb-5 text-sm font-semibold leading-relaxed text-gold">
              {home.hero.eyebrow}
            </p>

            <h1 className="text-display font-extrabold text-ink">{home.hero.title}</h1>

            <p className="mt-6 max-w-prose text-subtitle text-ink-muted">{home.hero.lead}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/#start">{home.hero.primaryCta}</ButtonLink>
              <ButtonLink href="/#system" variant="secondary">
                {home.hero.secondaryCta}
              </ButtonLink>
            </div>

            <p className="mt-8 inline-block border-s-2 border-gold ps-4 text-lg font-bold text-ink">
              {site.motto}
            </p>
          </div>

          {/* Portrait slot — renders only when the asset exists (Doc 04 §1.6). */}
          {portrait && (
            <div className="mx-auto w-full max-w-[18rem] md:max-w-none">
              <div className="relative aspect-square overflow-hidden rounded border border-gold/40">
                <Image
                  src={portrait.src}
                  alt={portrait.alt}
                  fill
                  priority
                  sizes="(max-width: 768px) 288px, 380px"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
