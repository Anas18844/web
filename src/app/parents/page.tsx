import type { Metadata } from 'next'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Capture } from '@/components/sections/Capture'
import { JsonLd } from '@/components/JsonLd'
import { pageGraph } from '@/lib/schema-org'
import { parents } from '@/content/copy'
import { assets } from '@/content/assets'
import { site } from '@/content/site'

export const metadata: Metadata = {
  title: parents.meta.title,
  description: parents.meta.description,
  alternates: { canonical: '/parents' },
  openGraph: {
    title: `${parents.meta.title} — ${site.name}`,
    description: parents.meta.description,
    url: '/parents',
  },
}

/**
 * The parent page (Doc 01 §3 — the P1→P4 journey).
 *
 * This is the page the student sends home, so it stands alone: who is teaching
 * and where they actually worked, how the follow-up works, what it costs, and
 * what we refuse to promise. Tone is calm and serious throughout.
 */
export default function ParentsPage() {
  const report = assets.parentReportSample

  return (
    <>
      <JsonLd data={pageGraph()} />

      <section className="border-b border-navy-line bg-navy-deep py-14 sm:py-20">
        <Container width="prose">
          <p className="mb-4 text-sm font-semibold text-gold">{parents.hero.eyebrow}</p>
          <h1 className="text-display font-extrabold text-ink">{parents.hero.title}</h1>
          <p className="mt-5 text-subtitle text-ink-muted">{parents.hero.lead}</p>
        </Container>
      </section>

      {/* Credentials first — a parent verifies before they read anything else. */}
      <Section width="prose">
        <SectionHeading title={parents.credentials.title} />
        <p className="text-body text-ink-muted">{parents.credentials.body}</p>

        <dl className="mt-8 grid gap-5">
          {[
            { term: 'التدريس', detail: parents.credentials.teaching },
            { term: 'الشغل الهندسي', detail: parents.credentials.industry },
            { term: 'المسابقات', detail: parents.credentials.competitions },
          ].map((row) => (
            <div key={row.term} className="border-s-2 border-gold/60 ps-5">
              <dt className="text-sm font-extrabold text-gold">{row.term}</dt>
              <dd className="mt-1 text-body text-ink-muted">{row.detail}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section tone="raised" width="prose">
        <SectionHeading title={parents.followUp.title} />
        <div className="grid gap-6">
          {parents.followUp.items.map((item) => (
            <article key={item.title} className="border-s-2 border-navy-line ps-5">
              <h3 className="text-lg font-extrabold text-ink">{item.title}</h3>
              <p className="mt-2 text-body text-ink-muted">{item.body}</p>
            </article>
          ))}
        </div>

        {/* The single strongest asset for a parent — shown the moment it exists. */}
        {report && (
          <figure className="mt-10">
            <Image
              src={report.src}
              alt={report.alt}
              width={report.width}
              height={report.height}
              sizes="(max-width: 768px) 100vw, 640px"
              className="rounded border border-navy-line"
            />
            <figcaption className="mt-3 text-sm text-ink-faint">
              نموذج من التقرير الأسبوعي
            </figcaption>
          </figure>
        )}
      </Section>

      <Section width="prose">
        <h2 className="text-title font-extrabold text-ink">{parents.cost.title}</h2>
        <p className="mt-4 text-body text-ink-muted">{parents.cost.body}</p>
      </Section>

      <Section tone="deep" width="prose">
        <div className="border-s-2 border-gold ps-5 sm:ps-7">
          <h2 className="text-title font-extrabold text-ink">{parents.transparency.title}</h2>
          <p className="mt-4 text-body text-ink-muted">{parents.transparency.body}</p>
        </div>
      </Section>

      <Section width="prose">
        <h2 className="text-title font-extrabold text-ink">{parents.evaluate.title}</h2>
        <p className="mt-4 text-body text-ink-muted">{parents.evaluate.body}</p>
        <p className="mt-6 text-body text-ink">
          للتواصل المباشر:{' '}
          <a
            href={`https://wa.me/${site.whatsapp.number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-gold underline underline-offset-4"
            dir="ltr"
          >
            {site.whatsapp.display}
          </a>
        </p>
      </Section>

      <Capture
        intent="parent"
        pageContext="parents"
        title={parents.capture.title}
        body={parents.capture.body}
      />
    </>
  )
}
