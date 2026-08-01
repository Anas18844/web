import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'
import { JsonLd } from '@/components/JsonLd'
import { pageGraph } from '@/lib/schema-org'
import { links } from '@/content/copy'
import { site } from '@/content/site'

export const metadata: Metadata = {
  title: links.meta.title,
  description: links.meta.description,
  alternates: { canonical: '/links' },
}

const CHANNEL_LABELS: Record<keyof typeof site.channels, string> = {
  youtube: 'يوتيوب',
  linkedin: 'لينكدإن',
  facebook: 'فيسبوك',
  tiktok: 'تيك توك',
  instagram: 'إنستجرام',
  telegram: 'تيليجرام',
}

/**
 * The official links registry (Doc 07 layer 4) — the pre-emptive defence
 * against impersonation accounts, which appear the moment a teacher succeeds.
 * Only channels with a configured URL are listed; empty ones stay invisible.
 */
export default function LinksPage() {
  const active = (Object.keys(site.channels) as (keyof typeof site.channels)[]).filter(
    (key) => site.channels[key],
  )

  return (
    <>
      <JsonLd data={pageGraph()} />

      <Section width="prose">
        <div data-reveal>
          <span aria-hidden="true" className="trace-rule mb-6" />
          <h1 className="text-display font-extrabold text-ink">{links.title}</h1>
          <p className="mt-5 text-body text-ink-muted">{links.lead}</p>
        </div>

        {active.length > 0 && (
          <ul
            data-reveal-stagger
            className="mt-10 divide-y divide-navy-line border-y border-navy-line"
          >
            {active.map((key) => (
              <li key={key}>
                <a
                  href={site.channels[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-4 py-5 text-lg font-bold text-ink transition-[color,padding] duration-200 hover:text-gold hover:ps-2"
                >
                  <span>{CHANNEL_LABELS[key]}</span>
                  {/* The arrow leans toward where it is about to take you. */}
                  <span
                    aria-hidden="true"
                    className="text-gold transition-transform duration-200 group-hover:-translate-x-1 group-hover:-translate-y-0.5"
                  >
                    ↖
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <div data-reveal className="mt-10">
          <h2 className="text-xl font-extrabold text-ink">{links.contactTitle}</h2>
          <p className="mt-3 text-body text-ink-muted">
            واتساب:{' '}
            <a
              href={`https://wa.me/${site.whatsapp.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-gold underline decoration-gold/40 underline-offset-4 transition-colors duration-200 hover:decoration-gold"
              dir="ltr"
            >
              {site.whatsapp.display}
            </a>
          </p>
          <p className="mt-2 text-body text-ink-muted">
            إيميل:{' '}
            <a
              href={`mailto:${site.email}`}
              className="break-all font-bold text-gold underline decoration-gold/40 underline-offset-4 transition-colors duration-200 hover:decoration-gold"
              dir="ltr"
            >
              {site.email}
            </a>
          </p>
        </div>
      </Section>
    </>
  )
}
