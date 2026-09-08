'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { ATTENDANCE, BRANCHES, GRADES } from '@/content/site'

/**
 * The register's controls: which day, which group.
 *
 * State lives in the URL so a filtered register is a link — the teacher can
 * bookmark "second bacc, Helwan" and open it straight to that group before each
 * lesson rather than re-selecting every time.
 */
const control =
  'min-h-[2.25rem] rounded border border-navy-line bg-navy px-2.5 py-1.5 text-xs font-bold text-ink ' +
  'transition-colors duration-200 focus:border-gold focus:outline-none'

export function RegisterFilters({
  values,
  exams,
}: {
  values: Record<string, string | undefined>
  /**
   * Passed in from the server page rather than imported. `content/exams.ts` is
   * server-only — it holds the answer key — so a client component cannot read
   * it, and duplicating the titles into a second file would be one more place
   * to forget when an exam is renamed.
   */
  exams: readonly { slug: string; title: string }[]
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

  const shiftDay = (days: number) => {
    const base = values.date ? new Date(`${values.date}T12:00:00`) : new Date()
    base.setDate(base.getDate() + days)
    set('date', base.toISOString().slice(0, 10))
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${pending ? 'opacity-60' : ''}`}>
      {/* Day stepping, because "yesterday" is the most common correction. */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          aria-label="اليوم اللي قبله"
          className="flex h-9 w-9 items-center justify-center rounded border border-navy-line text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
        >
          →
        </button>
        <input
          type="date"
          aria-label="تاريخ الحصة"
          value={values.date ?? ''}
          onChange={(e) => set('date', e.target.value)}
          className={`${control} font-mono`}
        />
        <button
          type="button"
          onClick={() => shiftDay(1)}
          aria-label="اليوم اللي بعده"
          className="flex h-9 w-9 items-center justify-center rounded border border-navy-line text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
        >
          ←
        </button>
      </div>

      <select
        aria-label="الصف"
        value={values.grade ?? ''}
        onChange={(e) => set('grade', e.target.value)}
        className={control}
      >
        <option value="">كل الصفوف</option>
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

      {exams.length > 1 && (
        <select
          aria-label="الامتحان"
          value={values.exam ?? ''}
          onChange={(e) => set('exam', e.target.value)}
          className={control}
        >
          {exams.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.title}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
