'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { normalizeArabic, toArabicDigits } from '@/lib/arabic'
import { KIND_LABEL, type SearchEntry } from '@/lib/search-types'

/**
 * Simple search: every word typed must appear somewhere in the entry, in any
 * order, after folding the Arabic spelling variants. Titles that match rank
 * first. No fuzzy matching and no library — the index is a few hundred lines,
 * and a student typing «تشفير» wants the pages that say تشفير.
 *
 * `?q=` is read on load so the header and other pages can link to a search.
 */
export function SiteSearch({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setQuery(q)
  }, [])

  const results = useMemo(() => {
    const words = normalizeArabic(query).split(' ').filter((w) => w.length > 0)
    if (words.length === 0) return []
    return entries
      .filter((e) => words.every((w) => e.text.includes(w)))
      .map((e) => {
        const title = normalizeArabic(e.title)
        return { e, score: words.filter((w) => title.includes(w)).length }
      })
      .sort((a, b) => b.score - a.score)
      .map((r) => r.e)
  }, [entries, query])

  const searched = query.trim().length > 0

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">ابحث في الموقع</span>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثلًا: تشفير، ملزمة الوحدة الثانية، حل التقييم…"
          className="min-h-[3.5rem] w-full rounded border border-navy-line bg-navy px-5 py-3 pe-12 text-lg text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-ink-faint/70 hover:border-gold/30 focus:border-gold focus:shadow-[0_0_0_3px_rgba(203,163,82,0.14)]"
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

      <p aria-live="polite" className="mt-4 min-h-[1.25rem] text-sm text-ink-faint">
        {searched &&
          (results.length > 0
            ? `${toArabicDigits(results.length)} نتيجة`
            : 'مفيش نتايج. جرّب كلمة واحدة، أو اسم الدرس أو الوحدة.')}
      </p>

      {results.length > 0 && (
        <ul className="mt-4 grid gap-3">
          {results.map((r) => (
            <li key={r.href + r.title}>
              <Link
                href={r.href}
                {...(r.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group block rounded border border-navy-line bg-navy-soft/30 p-4 transition-colors duration-200 hover:border-gold/50 sm:p-5"
              >
                <span className="text-xs font-bold text-gold">{KIND_LABEL[r.kind]}</span>
                <span className="mt-1 block font-extrabold leading-snug text-ink transition-colors duration-200 group-hover:text-gold">
                  {r.title}
                </span>
                <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-ink-muted">{r.sub}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
