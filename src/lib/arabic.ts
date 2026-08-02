/**
 * Arabic text helpers shared by server and client code.
 *
 * They live here rather than beside the components that use them because a
 * `'use client'` module's exports cannot be called from the server — only
 * rendered. The search index is folded during the build and the query is
 * folded in the browser, so both sides have to reach the same function.
 */

/**
 * Folds the spelling variations that make Arabic search fail: أ/إ/آ/ٱ against
 * ا, ة against ه, ى/ئ against ي, ؤ against و, plus optional diacritics and the
 * tatweel. Without this, a student typing "اسئله" finds nothing in an article
 * that says "أسئلة" — and tries exactly once before giving up.
 */
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Arabic-Indic digits, matching how every other number on the site is set. */
export function toArabicDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])
}

/**
 * Arabic counts do not work like English ones, and getting this wrong is the
 * kind of mistake a student notices immediately on an education site:
 *
 *   1        → مقال واحد        (singular)
 *   2        → مقالين           (dual — English has no equivalent)
 *   3 – 10   → ٣ مقالات         (plural)
 *   11 +     → ١٢ مقال          (back to singular)
 *
 * `few` and `many` carry a `{n}` token. Passing plain strings rather than a
 * formatter keeps this usable from a client component, where functions cannot
 * cross the boundary.
 */
export type PluralForms = { one: string; two: string; few: string; many: string }

export function arabicPlural(n: number, forms: PluralForms): string {
  if (n === 1) return forms.one
  if (n === 2) return forms.two
  const template = n >= 3 && n <= 10 ? forms.few : forms.many
  return template.replace('{n}', toArabicDigits(n))
}
