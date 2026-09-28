import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { buttonClasses } from '@/components/ui/Button'
import { VideoFacade } from '@/components/VideoFacade'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { JsonLd } from '@/components/JsonLd'
import { pageGraph } from '@/lib/schema-org'
import { platform } from '@/content/copy'
import { site } from '@/content/site'

export const metadata: Metadata = {
  title: platform.meta.title,
  description: platform.meta.description,
  alternates: { canonical: '/platform' },
  openGraph: {
    title: `${platform.meta.title} — ${site.name}`,
    description: platform.meta.description,
    url: '/platform',
  },
}

/**
 * Subscribing to the online platform (Code Up).
 *
 * The page a student lands on from the hero or from a WhatsApp message, so it
 * does one job: watch the walkthrough, follow three steps, press one button.
 * The order of the steps is the point — a student who pays before signing in
 * ends up with a payment and no account, so the warning sits right above the
 * button rather than in the video alone.
 *
 * No prices here on purpose: prices are not stated publicly.
 */
export default function PlatformPage() {
  return (
    <>
      <JsonLd data={pageGraph()} />

      <PageHero
        eyebrow={platform.hero.eyebrow}
        title={platform.hero.title}
        lead={platform.hero.lead}
      />

      <Section width="prose">
        <h2 data-reveal className="mb-5 text-title font-extrabold text-ink">
          {platform.videoTitle}
        </h2>
        <div data-reveal>
          <VideoFacade video={site.platform.guideVideo} proofName="platform-guide" />
        </div>

        <h2 data-reveal className="mb-5 mt-12 text-title font-extrabold text-ink">
          {platform.stepsTitle}
        </h2>
        <ol data-reveal-stagger className="grid gap-4">
          {platform.steps.map((step, i) => (
            <li key={step} className="flex items-center gap-4 border-s-2 border-gold/60 ps-5">
              <span className="grid h-10 w-10 flex-none place-items-center rounded bg-gold text-lg font-extrabold text-navy">
                {i + 1}
              </span>
              <span className="text-body text-ink">{step}</span>
            </li>
          ))}
        </ol>

        <p data-reveal className="mt-8 rounded border border-gold/40 bg-gold/[0.06] p-4 text-body font-bold text-gold">
          {platform.warning}
        </p>

        <div data-reveal className="mt-8 flex flex-col gap-3 sm:max-w-sm">
          <a
            href={site.platform.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="platform-page"
            className={buttonClasses('primary', 'px-8 text-lg')}
          >
            {platform.cta}
          </a>
        </div>

        <div data-reveal className="mt-12 border-t border-navy-line pt-8">
          <p className="mb-4 text-body text-ink-muted">{platform.helpTitle}</p>
          <div className="sm:max-w-sm">
            <WhatsAppButton context="platform" variant="whatsapp">
              {platform.helpCta}
            </WhatsAppButton>
          </div>
        </div>
      </Section>
    </>
  )
}
