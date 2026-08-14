import type { Metadata } from 'next'
import Image from 'next/image'
import { Section, SectionHeading } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
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

      <PageHero eyebrow={about.hero.eyebrow} title={about.hero.title} lead={about.hero.lead} />

      {/* ── Engineer ─────────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading title={about.engineer.title} intro={about.engineer.body} />

        <ul data-reveal-stagger className="mb-8 flex flex-wrap gap-2">
          {about.engineer.companies.map((name) => (
            <li
              key={name}
              className="border border-gold/40 px-3 py-1.5 text-sm font-bold text-gold transition-[background-color,border-color] duration-200 hover:border-gold hover:bg-gold/[0.08]"
            >
              {name}
            </li>
          ))}
        </ul>

        {companiesBanner && (
          <Image
            data-reveal
            src={companiesBanner.src}
            alt={companiesBanner.alt}
            width={companiesBanner.width}
            height={companiesBanner.height}
            sizes="(max-width: 768px) 100vw, 900px"
            className="mb-9 w-full rounded border border-navy-line"
          />
        )}

        {/* The proof photo is a tall portrait; giving it an equal column left a
            third of the row empty beside the numbers. A narrower column and a
            centred axis balance the two without cropping the evidence. */}
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.7fr] md:items-center md:gap-10">
          <dl data-reveal-stagger className="grid gap-6">
            {about.engineer.highlights.map((item) => (
              <div key={item.value} className="border-s-2 border-gold/60 ps-5">
                <dt className="text-2xl font-extrabold text-gold">{item.value}</dt>
                <dd className="mt-2 text-body text-ink-muted">{item.label}</dd>
              </div>
            ))}
          </dl>

          {industryPhotos.length > 0 && (
            <Image
              data-reveal
              src={industryPhotos[0].src}
              alt={industryPhotos[0].alt}
              width={industryPhotos[0].width}
              height={industryPhotos[0].height}
              sizes="(max-width: 768px) 100vw, 360px"
              className="mx-auto w-full max-w-sm rounded border border-navy-line md:max-w-none"
            />
          )}
        </div>
      </Section>

      {/* ── Education ────────────────────────────────────────────────────── */}
      <Section tone="raised" width="prose">
        <SectionHeading title={about.education.title} intro={about.education.body} />
        <dl data-reveal-stagger className="grid gap-5 sm:grid-cols-2">
          {about.education.items.map((item) => (
            <div key={item.title} className="card p-5">
              <dt className="font-extrabold text-ink">{item.title}</dt>
              <dd className="mt-2 text-sm text-ink-muted">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Competitive programming ──────────────────────────────────────── */}
      <Section>
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div data-reveal>
            <span aria-hidden="true" className="trace-rule mb-5" />
            <h2 className="text-title font-extrabold text-ink">{about.competitive.title}</h2>
            <p className="mt-4 text-body text-ink-muted">{about.competitive.body}</p>
          </div>

          <div data-reveal className="grid gap-4">
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
              data-reveal
              src={linkedinProof.src}
              alt={linkedinProof.alt}
              width={linkedinProof.width}
              height={linkedinProof.height}
              sizes="(max-width: 768px) 100vw, 480px"
              className="w-full rounded border border-navy-line"
            />
          )}
          <div data-reveal>
            <span aria-hidden="true" className="trace-rule mb-5" />
            <h2 className="text-title font-extrabold text-ink">{about.linkedin.title}</h2>
            <p className="mt-4 text-body text-ink-muted">{about.linkedin.body}</p>
            {site.channels.linkedin && (
              <a
                href={site.channels.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 inline-flex items-center gap-2 font-bold text-gold underline decoration-gold/40 underline-offset-4 transition-colors duration-200 hover:decoration-gold"
              >
                افتح الصفحة على لينكدإن
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover:-translate-x-1"
                >
                  ←
                </span>
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* ── Why teach secondary students ─────────────────────────────────── */}
      <Section tone="deep" width="prose">
        <div data-reveal className="border-s-2 border-gold ps-5 sm:ps-7">
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

      <Section width="prose" space="lg" className="wash-top border-t border-navy-line text-center">
        <div data-reveal>
          <span aria-hidden="true" className="trace-rule mx-auto mb-5 origin-center" />
          <h2 className="text-title font-extrabold text-ink">{about.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-prose text-body text-ink-muted">{about.cta.body}</p>
          <ButtonLink href="/#start" data-cta="about_page" className="mt-8">
            {about.cta.button}
          </ButtonLink>
        </div>
      </Section>
    </>
  )
}
