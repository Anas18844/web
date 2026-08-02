'use client'

import { useMemo, useState } from 'react'
import { ArticleCard, type CardData } from './ArticleCard'
import { arabicPlural, normalizeArabic, toArabicDigits, type PluralForms } from '@/lib/arabic'
import { cn } from '@/lib/utils'

export type BrowserArticle = CardData & {
  category: string
  haystack: string
}

export type BrowserCategory = { id: string; label: string; note: string; count: number }

/**
 * Search + category filter over the article index.
 *
 * Everything renders on the server first, so the full list is in the HTML for
 * crawlers and for anyone whose JavaScript has not arrived yet — filtering is
 * an enhancement on top of a page that already works.
 *
 * The only state is a query string and a category id; there is no fetching, no
 * debounce and no index library. Thirteen articles filter faster than a
 * keystroke, and a search dependency for that would be a dependency we pay for
 * on every visit to every page.
 */
export function ArticleBrowser({
  articles,
  categories,
  labels,
}: {
  articles: readonly BrowserArticle[]
  categories: readonly BrowserCategory[]
  labels: {
    searchLabel: string
    searchPlaceholder: string
    all: string
    empty: string
    emptyHint: string
    clear: string
    /** `few`/`many` contain a `{n}` token; functions cannot cross the boundary. */
    count: PluralForms
  }
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const needle = normalizeArabic(query.trim())
  const filtering = needle.length > 0 || category !== null

  const results = useMemo(() => {
    return articles.filter((article) => {
      if (category && article.category !== category) return false
      if (!needle) return true
      return article.haystack.includes(needle)
    })
  }, [articles, category, needle])

  return (
    <div>
      <div className="border-y border-navy-line py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">{labels.searchLabel}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="min-h-[3rem] w-full rounded border border-navy-line bg-navy px-4 py-3 pe-11 text-base text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-ink-faint/70 hover:border-gold/30 focus:border-gold focus:shadow-[0_0_0_3px_rgba(203,163,82,0.14)]"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute inset-y-0 end-4 my-auto h-5 w-5 text-ink-faint"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </label>

          <p aria-live="polite" className="text-sm text-ink-faint">
            {results.length === 0 ? '' : arabicPlural(results.length, labels.count)}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            {labels.all}
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(category === c.id ? null : c.id)}
              title={c.note}
            >
              {c.label}
              <span className={cn('ms-2 font-semibold', category === c.id ? 'text-navy/70' : 'text-ink-faint')}>
                {toArabicDigits(c.count)}
              </span>
            </Chip>
          ))}
        </div>
      </div>

      {results.length > 0 ? (
        <div
          data-reveal-stagger
          className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {results.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <div className="mt-9 border border-navy-line p-9 text-center sm:p-12">
          <p className="text-lg font-extrabold text-ink">{labels.empty}</p>
          <p className="mx-auto mt-3 max-w-prose text-body text-ink-muted">{labels.emptyHint}</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setCategory(null)
            }}
            className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded border border-navy-line px-6 py-3 text-base font-bold text-ink transition-[color,background-color,border-color] duration-200 hover:border-gold hover:bg-gold/[0.06] hover:text-gold"
          >
            {labels.clear}
          </button>
        </div>
      )}

      {/* Keeps the toolbar honest: the count above changes, and so does this. */}
      {filtering && results.length > 0 && (
        <p className="mt-6 text-sm text-ink-faint">
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setCategory(null)
            }}
            className="font-bold text-gold underline decoration-gold/40 underline-offset-4 transition-colors duration-200 hover:decoration-gold"
          >
            {labels.clear}
          </button>
        </p>
      )}
    </div>
  )
}

function Chip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn(
        'inline-flex items-center rounded border px-3.5 py-2 text-sm font-bold',
        'transition-[background-color,border-color,color,box-shadow] duration-200',
        active
          ? 'border-gold bg-gold text-navy shadow-[0_0_20px_-8px_rgba(203,163,82,0.9)]'
          : 'border-navy-line bg-transparent text-ink-muted hover:border-gold/50 hover:bg-gold/[0.06] hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

