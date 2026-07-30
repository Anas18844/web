/**
 * Student name helpers — dependency-free so both the client form and the
 * server validator can share them (same reasoning as `phone.ts`).
 *
 * The form asks for a triple Arabic name, because the follow-up team needs to
 * recognise the student the way the centre registers them.
 */

/** Arabic letters (incl. common diacritics) and spaces only. */
const ARABIC_NAME = /^[ء-يـً-ْ\s]+$/

export function normalizeName(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

export function nameParts(input: string): string[] {
  return normalizeName(input).split(' ').filter(Boolean)
}

/** True when the name is Arabic-only and made of at least three parts. */
export function isValidArabicTripleName(input: string): boolean {
  const value = normalizeName(input)
  if (!value) return false
  if (!ARABIC_NAME.test(value)) return false
  return nameParts(value).length >= 3
}

/** Tells the visitor exactly what is wrong, instead of a generic rejection. */
export function nameError(input: string): 'empty' | 'not_arabic' | 'not_triple' | null {
  const value = normalizeName(input)
  if (!value) return 'empty'
  if (!ARABIC_NAME.test(value)) return 'not_arabic'
  if (nameParts(value).length < 3) return 'not_triple'
  return null
}
