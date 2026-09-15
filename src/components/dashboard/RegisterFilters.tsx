'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { ATTENDANCE, BRANCHES, GRADES } from '@/content/site'

/**
 * The register's controls: which week, which group.
 *
 * The WEEK leads, because it decides everything else on the page — attendance,
 * the homework being checked and the paper being marked all follow from it.
 * There is no date picker any more: a date was a way of reaching a week, and a
 * wrong day inside the right week would have filed a register nobody could find.
 *
 * State lives in the URL so a register is a link: "week 3, second bacc,
 * Helwan" can be bookmarked and opened straight to that group.
 */
const control =
  'min-h-[2.25rem] rounded border border-navy-line bg-navy px-2.5 py-1.5 text-xs font-bold text-ink ' +
  'transition-colors duration-200 focus:border-gold focus:outline-none'

export function RegisterFilters({
  values,
  weeks,
}: {
  values: Record<string, string | undefined>
  /**
   * Passed in from the server rather than computed here: the week calendar lives
   * in a server-only module that also reads the homework and exam banks.
   */
  weeks: readonly { week: number; label: string }[]
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.push(`/dashboard/register?${next.toString()}`))
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${pending ? 'opacity-60' : ''}`}>
      <select
        aria-label="الأسبوع"
        value={values.week ?? ''}
        onChange={(e) => set('week', e.target.value)}
        className={`${control} border-gold/50 text-sm`}
      >
        {weeks.map((w) => (
          <option key={w.week} value={w.week}>
            {w.label}
          </option>
        ))}
      </select>

      {/* No "all grades": a week's homework and paper belong to one grade. */}
      <select
        aria-label="الصف"
        value={values.grade ?? 'second_bacc'}
        onChange={(e) => set('grade', e.target.value)}
        className={control}
      >
        {GRADES.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>

      <select
        aria-label="أونلاين ولا سنتر"
        value={values.attendance ?? ''}
        onChange={(e) => set('attendance', e.target.value)}
        className={control}
      >
        <option value="">أونلاين وسنتر</option>
        {ATTENDANCE.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      <select
        aria-label="الفرع"
        value={values.branch ?? ''}
        onChange={(e) => set('branch', e.target.value)}
        className={control}
      >
        <option value="">كل الفروع</option>
        {BRANCHES.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>
    </div>
  )
}
