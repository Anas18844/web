import type { Metadata } from 'next'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/ui/PageHero'
import { Meta } from '@/components/knowledge/ArticleCard'
import { ArticleBrowser, type BrowserArticle } from '@/components/knowledge/ArticleBrowser'
import { JsonLd } from '@/components/JsonLd'
import { normalizeArabic, toArabicDigits } from '@/lib/arabic'
import { pageGraph } from '@/lib/schema-org'
import { knowledge } from '@/content/copy'
import { site } from '@/content/site'
import {
  articles,
  byDate,
  categories,
  categoryOf,
  featured,
  formatDate,
  readingLabel,
  rest,
  searchText,
} from '@/content/knowledge'

export const metadata: Metadata = {
  title: knowledge.meta.title,
  description: knowledge.meta.description,
  alternates: { canonical: '/knowledge' },
  openGraph: {
    title: `${knowledge.meta.title} — ${site.name}`,
    description: knowledge.meta.description,
    url: '/knowledge',
    type: 'website',
  },
}

/**
 * مركز المعرفة — the hub.
 *
 * Three layers, in the order a visitor actually uses them:
 *   1. One featured piece, given real editorial scale. Somebody arriving with
 *      no particular question needs a door, not a grid.
 *   2. The full index behind a search box and category chips, for somebody who
 *      arrived WITH a question.
 *   3. Nothing else. No form, no price, no WhatsApp bar (Doc 05 keeps capture
 *      to pages that promise it) — the restraint is the argument.
 */
export default function KnowledgePage() {
  const cards: BrowserArticle[] = rest.map((article) => {
    const category = categoryOf(article.category)
    return {
      slug: article.slug,
      title: article.title,
      dek: article.dek,
      category: article.category,
      categoryLabel: category?.label ?? '',
      date: article.date,
      dateLabel: formatDate(article.date),
      minutesLabel: readingLabel(article),
      // Pre-folded on the server so the browser never re-normalises 13 records
      // on every keystroke.
      haystack: normalizeArabic(searchText(article)),
    }
  })

  const chips = categories
    .map((c) => ({ ...c, count: rest.filter((a) => a.category === c.id).length }))
    .filter((c) => c.count > 0)

  const featuredCategory = categoryOf(featured.category)

  return (
    <>
      <JsonLd
        data={pageGraph([
          {
            '@type': 'Blog',
            '@id': `${site.url}/knowledge#blog`,
            name: `${knowledge.meta.title} — ${site.name}`,
            description: knowledge.meta.description,
            url: `${site.url}/knowledge`,
            inLanguage: 'ar',
            blogPost: byDate.map((article) => ({
              '@type': 'BlogPosting',
              headline: article.title,
              description: article.dek,
              datePublished: article.date,
              url: `${site.url}/knowledge/${article.slug}`,
            })),
          },
        ])}
      />

      <PageHero
        eyebrow={knowledge.hero.eyebrow}
        title={knowledge.hero.title}
        lead={knowledge.hero.lead}
      />

      {/* ── The door ─────────────────────────────────────────────────────── */}
      <Section space="sm">
        <article data-reveal className="card card-lit bg-navy-soft/25 p-7 sm:p-10 lg:p-12">
          <p className="text-xs font-extrabold tracking-wide text-gold">
            {knowledge.featuredLabel}
          </p>

          <h2 className="mt-5 text-title font-extrabold leading-tight text-ink">
            <Link
              href={`/knowledge/${featured.slug}`}
              className="transition-colors duration-200 after:absolute after:inset-0 hover:text-gold"
            >
              {featured.title}
            </Link>
          </h2>

          <p className="mt-5 max-w-prose text-subtitle text-ink-muted">{featured.dek}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Meta
              categoryLabel={featuredCategory?.label ?? ''}
              minutesLabel={readingLabel(featured)}
            />
            <span aria-hidden="true" className="h-3 w-px bg-navy-line" />
            <time dateTime={featured.date} className="text-xs text-ink-faint">
              {formatDate(featured.date)}
            </time>
          </div>
        </article>
      </Section>

      {/* ── The index ────────────────────────────────────────────────────── */}
      <Section id="all" tone="raised">
        <header data-reveal className="mb-9 sm:mb-10">
          <span aria-hidden="true" className="trace-rule mb-5" />
          <h2 className="text-title font-extrabold text-ink">{knowledge.browseTitle}</h2>
          <p className="mt-3 max-w-prose text-body text-ink-muted">{knowledge.browseIntro}</p>
        </header>

        <ArticleBrowser
          articles={cards}
          categories={chips}
          labels={{
            searchLabel: knowledge.search.label,
            searchPlaceholder: knowledge.search.placeholder,
            all: knowledge.search.all,
            empty: knowledge.search.empty,
            emptyHint: knowledge.search.emptyHint,
            clear: knowledge.search.clear,
            count: knowledge.search.count,
          }}
        />
      </Section>

      {/* A quiet count, so the page states its own size instead of implying it. */}
      <Section space="sm" className="border-t border-navy-line">
        <p data-reveal className="text-center text-sm text-ink-faint">
          {toArabicDigits(articles.length)} مقال منشور — وبنزوّد عليهم أول بأول.
        </p>
      </Section>
    </>
  )
}
