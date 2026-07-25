/**
 * Phone helpers — deliberately dependency-free.
 *
 * This lives apart from `validation.ts` on purpose: the form component needs
 * `normalizePhone` on the client, and importing it from the zod-based module
 * would drag the whole validation library into the browser bundle.
 */

/** Egyptian mobile numbers: 010 / 011 / 012 / 015 followed by 8 digits. */
export const EG_MOBILE = /^01[0125]\d{8}$/

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/**
 * Normalises anything a visitor might type into the canonical 01XXXXXXXXX form:
 * Arabic-Indic digits, +20 / 0020 prefixes, spaces, dashes and brackets.
 */
export function normalizePhone(input: string): string {
  let s = input
    .split('')
    .map((ch) => {
      const i = ARABIC_DIGITS.indexOf(ch)
      return i === -1 ? ch : String(i)
    })
    .join('')

  s = s.replace(/[\s\-()]/g, '')

  if (s.startsWith('+20')) s = '0' + s.slice(3)
  else if (s.startsWith('0020')) s = '0' + s.slice(4)
  else if (s.startsWith('20') && s.length === 12) s = '0' + s.slice(2)

  return s
}

export function isValidEgyptianMobile(input: string): boolean {
  return EG_MOBILE.test(normalizePhone(input))
}
