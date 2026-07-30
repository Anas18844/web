import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Capture } from '@/components/sections/Capture'
import { JsonLd } from '@/components/JsonLd'
import { pageGraph } from '@/lib/schema-org'
import { courses } from '@/content/copy'
import { site } from '@/content/site'

export const metadata: Metadata = {
  title: courses.meta.title,
  description: courses.meta.description,
  alternates: { canonical: '/courses' },
  openGraph: {
    title: `${courses.meta.title} — ${site.name}`,
    description: courses.meta.description,
    url: '/courses',
  },
}

/**
 * "الكورسات" — the free-first offer.
 *
 * Structure mirrors the founder's ad script: a question the student is already
 * asking, then a blunt answer that refuses the sale ("you don't need to
 * subscribe"), then the optional paid layer for whoever wants closer
 * follow-up. The honesty line at the end of each track is the point of the
 * page — it must never be softened into a pitch.
 */
export default function CoursesPage() {
  return (
    <>
      <JsonLd data={pageGraph()} />

      <section className="border-b border-navy-line bg-navy-deep py-14 sm:py-20">
        <Container width="prose">
          <p className="mb-4 text-sm font-semibold text-gold">{courses.hero.eyebrow}</p>
          <h1 className="text-display font-extrabold text-ink">{courses.hero.title}</h1>
          <p className="mt-5 text-subtitle text-ink-muted">{courses.hero.lead}</p>
        </Container>
      </section>

      {/* What "free" actually means, item by item. */}
      <Section>
        <SectionHeading title={courses.freeIncludes.title} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {courses.freeIncludes.items.map((item) => (
            <article key={item.title} className="border border-gold/30 bg-navy-soft/30 p-5">
              <h3 className="flex items-center gap-2 font-extrabold text-ink">
                <span aria-hidden="true" className="text-gold">
                  ✓
                </span>
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-body font-bold text-gold">{courses.freeIncludes.note}</p>
      </Section>

      {/* The three tracks. */}
      {courses.tracks.map((track, index) => (
        <Section key={track.id} id={track.id} tone={index % 2 === 0 ? 'raised' : 'base'}>
          <div className="mb-6 inline-block border border-gold/40 px-3 py-1.5 text-sm font-bold text-gold">
            {track.badge}
          </div>

          <div className="grid gap-9 md:grid-cols-2 md:gap-12">
            <div>
              <p className="text-lg text-ink-muted">{track.question}</p>
              <p className="mt-2 text-title font-extrabold text-ink">{track.answer}</p>
              <p className="mt-5 text-body text-ink-muted">{track.body}</p>

              {/* The anti-sell. This is the whole point of the page. */}
              <p className="mt-6 border-s-2 border-gold ps-4 text-body font-bold text-ink">
                {track.honest}
              </p>
            </div>

            <div className="border border-navy-line bg-navy-deep/60 p-6">
              <h3 className="text-lg font-extrabold text-ink">{track.platformTitle}</h3>
              <p className="mt-2 text-sm text-ink-muted">{track.platformBody}</p>
              <ul className="mt-5 grid gap-3">
                {track.platformItems.map((item) => (
                  <li key={item} className="flex gap-3 text-body text-ink-muted">
                    <span aria-hidden="true" className="mt-1 shrink-0 text-gold">
                      ▪
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      ))}

      {/* Booking is free — stated plainly, because "free booking" removes the
          last hesitation before the form. */}
      <Section tone="deep" width="prose" className="text-center">
        <h2 className="text-title font-extrabold text-gold">{courses.booking.title}</h2>
        <p className="mx-auto mt-4 max-w-prose text-body text-ink-muted">{courses.booking.body}</p>
      </Section>

      <Capture intent="intro_session" pageContext="courses" title={courses.booking.cta} />
    </>
  )
}
