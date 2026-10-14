/**
 * Search types and labels, apart from the index builder: the builder reads
 * server-only content, and the search box in the browser must not import it.
 */

export type SearchKind = 'lesson' | 'summary' | 'article' | 'booklet' | 'answers' | 'page'

export type SearchEntry = {
  kind: SearchKind
  title: string
  sub: string
  href: string
  /** Opens in a new tab: PDFs, interactive pages, Code Up. */
  external?: boolean
  /** Everything matchable, folded with `normalizeArabic` once, here. */
  text: string
}

export const KIND_LABEL: Record<SearchKind, string> = {
  lesson: 'درس',
  summary: 'ملخص',
  article: 'مقال',
  booklet: 'ملزمة',
  answers: 'حل تقييم',
  page: 'صفحة',
}
