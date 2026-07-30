import type { Metadata } from 'next'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { JsonLd } from '@/components/JsonLd'
import { pageGraph } from '@/lib/schema-org'
import { about } from '@/content/copy'
import { assets } from '@/content/assets'
import { site } from '@/content/site'

export const metadata: Metadata = {
  title: about.meta.title,
  description: about.meta.description,
  alternates: { canonical: '/about' },
  openGraph: {
    title: `${about.meta.title} — ${site.name}`,
    description: about.meta.description,
    url: '/about',
  },
}

/**
 * "مين مستر أنس" — the full introduction.
 *
 * Everything personal lives here rather than on the home page, which belongs
 * to the student. A visitor arriving here has explicitly asked who he is, so
 * the engineering credentials answer a question instead of interrupting a pitch
 * — and every claim on the page sits next to the screenshot that proves it.
 */
export default function AboutPage() {
  const { companiesBanner, industryPhotos, codeforcesProof, linkedinProof, competitionPhotos } =
    assets

  return (
    <>
      <JsonLd data={pageGraph()} />

      <section className="border-b border-navy-line bg-navy-deep py-14 sm:py-20">
        <Container width="prose">
          <p className="mb-4 text-sm font-semibold text-gold">{about.hero.eyebrow}</p>
          <h1 className="text-display font-extrabold text-ink">{about.hero.title}</h1>
          <p className="mt-5 text-subtitle text-ink-muted">{about.hero.lead}</p>
        </Container>
      </section>

      {/* ── Engineer ─────────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading title={about.engineer.title} intro={about.engineer.body} />

        <ul className="mb-8 flex flex-wrap gap-2">
          {about.engineer.companies.map((name) => (
            <li
              key={name}
              className="border border-gold/40 px-3 py-1.5 text-sm font-bold text-gold"
            >
              {name}
            </li>
          ))}
        </ul>

        {companiesBanner && (
          <Image
            src={companiesBanner.src}
            alt={companiesBanner.alt}
            width={companiesBanner.width}
            height={companiesBanner.height}
            sizes="(max-width: 768px) 100vw, 900px"
            className="mb-9 w-full rounded border border-navy-line"
          />
        )}

        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-start">
          <dl className="grid gap-6">
            {about.engineer.highlights.map((item) => (
              <div key={item.value} className="border-s-2 border-gold/60 ps-5">
                <dt className="text-2xl font-extrabold text-gold">{item.value}</dt>
                <dd className="mt-2 text-body text-ink-muted">{item.label}</dd>
              </div>
            ))}
          </dl>

          {industryPhotos.length > 0 && (
            <Image
              src={industryPhotos[0].src}
              alt={industryPhotos[0].alt}
              width={industryPhotos[0].width}
              height={industryPhotos[0].height}
              sizes="(max-width: 768px) 100vw, 340px"
              className="w-full rounded border border-navy-line"
            />
          )}
        </div>
      </Section>

      {/* ── Education ────────────────────────────────────────────────────── */}
      <Section tone="raised" width="prose">
        <SectionHeading title={about.education.title} intro={about.education.body} />
        <dl className="grid gap-5 sm:grid-cols-2">
          {about.education.items.map((item) => (
            <div key={item.title} className="border border-navy-line p-5">
              <dt className="font-extrabold text-ink">{item.title}</dt>
              <dd className="mt-2 text-sm text-ink-muted">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Competitive programming ──────────────────────────────────────── */}
      <Section>
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-title font-extrabold text-ink">{about.competitive.title}</h2>
            <p className="mt-4 text-body text-ink-muted">{about.competitive.body}</p>
          </div>

          <div className="grid gap-4">
            {codeforcesProof && (
              <Image
                src={codeforcesProof.src}
                alt={codeforcesProof.alt}
                width={codeforcesProof.width}
                height={codeforcesProof.height}
                sizes="(max-width: 768px) 100vw, 480px"
                className="w-full rounded border border-navy-line"
              />
            )}
            {/* ICPC photos slot — appears the moment they are supplied. */}
            {competitionPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {competitionPhotos.slice(0, 2).map((img) => (
                  <Image
                    key={img.src}
                    src={img.src}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    sizes="(max-width: 768px) 45vw, 240px"
                    className="h-full w-full rounded border border-navy-line object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── LinkedIn ─────────────────────────────────────────────────────── */}
      <Section tone="raised">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          {linkedinProof && (
            <Image
              src={linkedinProof.src}
              alt={linkedinProof.alt}
              width={linkedinProof.width}
              height={linkedinProof.height}
              sizes="(max-width: 768px) 100vw, 480px"
              className="w-full rounded border border-navy-line"
            />
          )}
          <div>
            <h2 className="text-title font-extrabold text-ink">{about.linkedin.title}</h2>
            <p className="mt-4 text-body text-ink-muted">{about.linkedin.body}</p>
            {site.channels.linkedin && (
              <a
                href={site.channels.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block font-bold text-gold underline underline-offset-4"
              >
                افتح الصفحة على لينكدإن
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* ── Why teach secondary students ─────────────────────────────────── */}
      <Section tone="deep" width="prose">
        <div className="border-s-2 border-gold ps-5 sm:ps-7">
          <h2 className="text-title font-extrabold text-ink">{about.whyTeaching.title}</h2>
          <div className="mt-5 grid gap-4">
            {about.whyTeaching.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-body text-ink-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </Section>

      <Section width="prose" className="text-center">
        <h2 className="text-title font-extrabold text-ink">{about.cta.title}</h2>
        <p className="mx-auto mt-4 max-w-prose text-body text-ink-muted">{about.cta.body}</p>
        <ButtonLink href="/#start" className="mt-7">
          {about.cta.button}
        </ButtonLink>
      </Section>
    </>
  )
}
