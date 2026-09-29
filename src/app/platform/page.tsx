import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { buttonClasses } from '@/components/ui/Button'
import { IconPlate, type IconName } from '@/components/ui/Icon'
import { VideoFacade } from '@/components/VideoFacade'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { JsonLd } from '@/components/JsonLd'
import { pageGraph } from '@/lib/schema-org'
import { platform } from '@/content/copy'
import { site } from '@/content/site'
import { toArabicDigits } from '@/lib/arabic'

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
 * The online platform (Code Up), in full.
 *
 * Rewritten 2026-09-30 from the platform-details video. The video still comes
 * first — it is the teacher explaining his own system — and everything under it
 * is the same system written down, for the student who wants to check one
 * thing without scrubbing through the video.
 *
 * The order follows a student's questions: when does it come out, what do I get
 * each month, what is free, how hard does it get, what is inside, what does it
 * cost me to join (the plans, never the prices), and how do I join. The
 * sign-in-before-paying warning still sits right above the button: a student
 * who pays before signing in ends up with a payment and no account.
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

        <Block title={platform.schedule.title}>
          <p className="text-body leading-relaxed text-ink-muted">{platform.schedule.body}</p>
        </Block>

        <Block title={platform.month.title}>
          <TitledList items={platform.month.items} />
        </Block>

        <Block title={platform.free.title}>
          <Bullets items={platform.free.items} />
        </Block>

        <Block title={platform.ladder.title}>
          <p className="mb-5 text-body text-ink-muted">{platform.ladder.intro}</p>
          <ol data-reveal-stagger className="grid gap-3">
            {platform.ladder.items.map((level, i) => (
              <li key={level.title} className="flex items-start gap-4">
                <span className="grid h-9 w-9 flex-none place-items-center rounded bg-gold font-extrabold text-navy">
                  {toArabicDigits(i + 1)}
                </span>
                <span className="pt-1">
                  <b className="text-ink">{level.title}</b>
                  <span className="text-ink-muted"> — {level.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </Block>

        <Block title={platform.features.title}>
          <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2">
            {platform.features.items.map((f) => (
              <article key={f.title} className="card flex gap-4 p-5">
                <IconPlate name={f.icon as IconName} className="flex-none" />
                <div>
                  <h3 className="font-extrabold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{f.body}</p>
                </div>
              </article>
            ))}
          </div>
        </Block>

        <Block title={platform.plans.title}>
          <TitledList items={platform.plans.items} />
          <p data-reveal className="mt-5 text-body leading-relaxed text-ink-muted">
            {platform.plans.books}
          </p>
          <p data-reveal className="mt-3 text-sm text-ink-faint">{platform.plans.pricesNote}</p>
        </Block>

        <Block title={platform.before.title}>
          <Bullets items={platform.before.items} />
        </Block>

        <Block title={platform.stepsTitle}>
          <ol data-reveal-stagger className="grid gap-4">
            {platform.steps.map((step, i) => (
              <li key={step} className="flex items-center gap-4 border-s-2 border-gold/60 ps-5">
                <span className="grid h-10 w-10 flex-none place-items-center rounded bg-gold text-lg font-extrabold text-navy">
                  {toArabicDigits(i + 1)}
                </span>
                <span className="text-body text-ink">{step}</span>
              </li>
            ))}
          </ol>
        </Block>

        <Block title={platform.payment.title}>
          <Bullets items={platform.payment.items} />
        </Block>

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

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 data-reveal className="mb-5 text-title font-extrabold text-ink">
        {title}
      </h2>
      {children}
    </section>
  )
}

function TitledList({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <ul data-reveal-stagger className="grid gap-3">
      {items.map((item) => (
        <li key={item.title} className="border-s-2 border-gold/60 ps-5">
          <b className="text-ink">{item.title}</b>
          <p className="mt-1 text-body text-ink-muted">{item.body}</p>
        </li>
      ))}
    </ul>
  )
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul data-reveal-stagger className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-body leading-relaxed text-ink-muted">
          <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
