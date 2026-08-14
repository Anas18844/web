import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { home } from '@/content/copy'
import { byDate, categoryOf, formatDate, readingLabel } from '@/content/knowledge'

/**
 * The invitation to مركز المعرفة.
 *
 * Placed straight after the questions section, where a visitor has just
 * finished reading six answers and is most likely to have a seventh.
 *
 * It is built as an index, not as a banner: three real headlines with their
 * real reading times, pulled live from the Knowledge Center. A section that
 * SAYS "we publish regularly" is an advertisement; a section that SHOWS what
 * went up last is a table of contents, and a student can tell the difference
 * in about a second. It also means this block can never claim something the
 * Knowledge Center is not actually doing — if publishing stops, the dates here
 * say so.
 */
export function KnowledgeTeaser() {
  const latest = byDate.slice(0, 3)

  return (
    <Section id="knowledge" tone="paperSoft" seam="fromDark">
      <div className="grid gap-10 md:grid-cols-[1fr_1.15fr] md:gap-14">
        <div data-reveal>
          <span aria-hidden="true" className="trace-rule mb-5" />
          <h2 className="text-title font-extrabold text-ink">{home.knowledge.title}</h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">{home.knowledge.body}</p>

          <ButtonLink
            href="/knowledge"
            data-cta="knowledge_teaser"
            variant="secondary"
            className="mt-7"
          >
            {home.knowledge.cta}
          </ButtonLink>
        </div>

        <div data-reveal>
          <h3 className="text-xs font-extrabold tracking-wide text-ink-faint">
            {home.knowledge.latestLabel}
          </h3>

          <ul className="mt-5 divide-y divide-navy-line border-y border-navy-line">
            {latest.map((article) => (
              <li key={article.slug} className="group relative">
                  <Link
                    href={`/knowledge/${article.slug}`}
                    className="block py-5 transition-[padding] duration-200 hover:ps-2"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                      <span className="text-gold">{categoryOf(article.category)?.label}</span>
                      <span aria-hidden="true" className="h-3 w-px bg-navy-line" />
                      <span className="font-semibold text-ink-faint">
                        {readingLabel(article)}
                      </span>
                    </div>

                    <p className="mt-2 font-extrabold leading-snug text-ink transition-colors duration-200 group-hover:text-gold">
                      {article.title}
                    </p>

                    <time dateTime={article.date} className="mt-2 block text-xs text-ink-faint">
                      {formatDate(article.date)}
                    </time>
                  </Link>
                </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
