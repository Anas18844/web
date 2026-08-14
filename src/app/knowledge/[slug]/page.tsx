import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { ArticleBody } from '@/components/knowledge/ArticleBody'
import { ArticleCard, Meta } from '@/components/knowledge/ArticleCard'
import { ArticleAnalytics } from '@/components/ArticleAnalytics'
import { JsonLd } from '@/components/JsonLd'
import { pageGraph } from '@/lib/schema-org'
import { knowledge } from '@/content/copy'
import { site } from '@/content/site'
import {
  articles,
  categoryOf,
  findArticle,
  formatDate,
  readingLabel,
  readingMinutes,
  relatedTo,
} from '@/content/knowledge'

type Params = { slug: string }

/** Every article is known at build time, so every article is a static file. */
export function generateStaticParams(): Params[] {
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const article = findArticle(slug)
  if (!article) return {}

  const url = `/knowledge/${article.slug}`

  return {
    title: article.title,
    description: article.dek,
    alternates: { canonical: url },
    keywords: [...article.tags],
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.dek,
      url,
      publishedTime: article.date,
      authors: [site.name],
      tags: [...article.tags],
    },
    twitter: { card: 'summary_large_image', title: article.title, description: article.dek },
  }
}

/**
 * A single article.
 *
 * Held to `prose` width throughout — the measure is the whole design here, and
 * a body text line that runs the full container is the fastest way to make a
 * long read feel like homework.
 *
 * There is no capture form at the end and that is deliberate: this page exists
 * to be useful to somebody who may never buy anything, and closing it with a
 * form would undo the sentence the Knowledge Center opens with.
 */
export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const article = findArticle(slug)
  if (!article) notFound()

  const category = categoryOf(article.category)
  const related = relatedTo(article)

  return (
    <>
      <JsonLd
        data={pageGraph([
          {
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.dek,
            datePublished: article.date,
            dateModified: article.date,
            inLanguage: 'ar',
            url: `${site.url}/knowledge/${article.slug}`,
            mainEntityOfPage: `${site.url}/knowledge/${article.slug}`,
            author: { '@id': `${site.url}/#person` },
            publisher: { '@id': `${site.url}/#organization` },
            articleSection: category?.label,
            keywords: article.tags.join('، '),
            isAccessibleForFree: true,
            timeRequired: `PT${readingMinutes(article)}M`,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${site.url}/` },
              {
                '@type': 'ListItem',
                position: 2,
                name: knowledge.meta.title,
                item: `${site.url}/knowledge`,
              },
              { '@type': 'ListItem', position: 3, name: article.title },
            ],
          },
        ])}
      />

      {/*
       * Reading progress, drawn as the site's own trace. It is a scroll-driven
       * CSS animation — no listener, no JavaScript, nothing running per frame —
       * and it simply does not render in browsers without support, which is the
       * correct outcome for a purely informational flourish.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-16 z-40 h-0.5 w-full bg-transparent"
      >
        <span className="read-progress block h-full w-full bg-gold" />
      </div>

      <article>
        <header className="wash-start border-b border-navy-line bg-navy-deep py-14 sm:py-20">
          <Container width="prose">
            <nav aria-label="مسار التنقل" className="hero-enter mb-6">
              <Link
                href="/knowledge"
                className="group inline-flex items-center gap-2 text-sm font-bold text-gold transition-colors duration-200 hover:text-ink"
              >
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
                {knowledge.article.back}
              </Link>
            </nav>

            <h1 className="hero-enter text-display font-extrabold leading-tight text-ink">
              {article.title}
            </h1>

            <p className="hero-enter-late mt-5 text-subtitle text-ink-muted">{article.dek}</p>

            <div className="hero-enter-late mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-navy-line/70 pt-6">
              <Meta categoryLabel={category?.label ?? ''} minutesLabel={readingLabel(article)} />
              <span aria-hidden="true" className="h-3 w-px bg-navy-line" />
              <time dateTime={article.date} className="text-xs text-ink-faint">
                {formatDate(article.date)}
              </time>
            </div>
          </Container>
        </header>

        <Section width="prose">
          <ArticleBody blocks={article.body} />

          {article.tags.length > 0 && (
            <footer className="mt-12 border-t border-navy-line pt-7">
              <h2 className="text-xs font-extrabold tracking-wide text-ink-faint">
                {knowledge.article.tagsLabel}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border border-navy-line px-3 py-1.5 text-sm font-bold text-ink-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </footer>
          )}

          {/* The finish line. Reaching this is what `article_read` means. */}
          <div id="article-end" aria-hidden="true" className="h-px w-full" />
        </Section>
      </article>

      <ArticleAnalytics slug={article.slug} category={article.category} />

      {related.length > 0 && (
        <Section tone="raised">
          <header data-reveal className="mb-9">
            <span aria-hidden="true" className="trace-rule mb-5" />
            <h2 className="text-title font-extrabold text-ink">
              {knowledge.article.relatedTitle}
            </h2>
          </header>

          <div data-reveal-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {related.map((item) => {
              const itemCategory = categoryOf(item.category)
              return (
                <ArticleCard
                  key={item.slug}
                  article={{
                    slug: item.slug,
                    title: item.title,
                    dek: item.dek,
                    categoryLabel: itemCategory?.label ?? '',
                    date: item.date,
                    dateLabel: formatDate(item.date),
                    minutesLabel: readingLabel(item),
                  }}
                />
              )
            })}
          </div>
        </Section>
      )}
    </>
  )
}
