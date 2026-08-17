import { ATTENDANCE, BRANCHES, GRADES, HEARD_FROM } from '@/content/site'

/**
 * Database values to Arabic, in one place.
 *
 * The rest of the site already owns these words — GRADES, BRANCHES, HEARD_FROM
 * are what the capture form renders — so the dashboard reads from the same
 * lists rather than restating them. A second copy is a second thing to update,
 * and the day they disagree, the dashboard starts describing students in terms
 * the form never offered them.
 */

const fromList = (list: readonly { value: string; label: string }[]) =>
  Object.fromEntries(list.map((i) => [i.value, i.label])) as Record<string, string>

export const GRADE_LABELS = fromList(GRADES)
export const BRANCH_LABELS = fromList(BRANCHES)
export const HEARD_FROM_LABELS = fromList(HEARD_FROM)
export const ATTENDANCE_LABELS = fromList(ATTENDANCE)

/**
 * The follow-up pipeline, in order. The order is meaningful — it is what makes
 * this ordinal rather than categorical, and what the funnel colour ramp encodes.
 */
export const STATUSES = [
  { value: 'new', label: 'جديد' },
  { value: 'contacted', label: 'اتكلمنا معاه' },
  { value: 'booked', label: 'حجز' },
  { value: 'enrolled', label: 'اشترك' },
  { value: 'closed', label: 'مقفول' },
] as const

export const STATUS_LABELS = fromList(STATUSES)

export const STAGE_LABELS: Record<string, string> = {
  partial: 'ناقص',
  complete: 'كامل',
}

export const SOURCE_LABELS: Record<string, string> = {
  website: 'الموقع',
  manual: 'إضافة يدوية',
}

export function label(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '—'
  return map[value] ?? value
}

/** Short, unambiguous, and never "منذ ٣ أيام" — a date people can cross-check. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${time}`
}
