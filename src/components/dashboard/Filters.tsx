'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { GRADES, HEARD_FROM } from '@/content/site'
import { STATUSES } from '@/lib/dashboard-labels'

/**
 * Filters, in one row, above the table.
 *
 * State lives in the URL rather than in React. That is what makes a filtered
 * view something a person can send to a colleague, bookmark, or return to with
 * the back button — and it means the server does the filtering, so a narrowed
 * view fetches less rather than hiding rows it already downloaded.
 */
const control =
  'min-h-[2.25rem] rounded border border-navy-line bg-navy px-2.5 py-1.5 text-xs font-bold text-ink ' +
  'transition-colors duration-200 focus:border-gold focus:outline-none'

export function Filters({ values }: { values: Record<string, string | undefined> }) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.push(`/dashboard?${next.toString()}`))
  }

  const active = Object.values(values).some(Boolean)

  return (
    <div className={`flex flex-wrap items-center gap-2 ${pending ? 'opacity-60' : ''}`}>
      <input
        type="search"
        defaultValue={values.q ?? ''}
        placeholder="دوّر بالاسم…"
        aria-label="دوّر بالاسم"
        onKeyDown={(e) => {
          if (e.key === 'Enter') set('q', (e.target as HTMLInputElement).value)
        }}
        className={`${control} w-40 font-normal placeholder:text-ink-faint/70 sm:w-52`}
      />

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
        aria-label="حالة المتابعة"
        value={values.status ?? ''}
        onChange={(e) => set('status', e.target.value)}
        className={control}
      >
        <option value="">كل الحالات</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        aria-label="اكتمال الفورم"
        value={values.stage ?? ''}
        onChange={(e) => set('stage', e.target.value)}
        className={control}
      >
        <option value="">كامل وناقص</option>
        <option value="complete">كامل بس</option>
        <option value="partial">ناقص بس</option>
      </select>

      <select
        aria-label="مصدر التسجيل"
        value={values.source ?? ''}
        onChange={(e) => set('source', e.target.value)}
        className={control}
      >
        <option value="">الموقع واليدوي</option>
        <option value="website">من الموقع</option>
        <option value="manual">إضافة يدوية</option>
      </select>

      <select
        aria-label="جه منين"
        value={values.heardFrom ?? ''}
        onChange={(e) => set('heardFrom', e.target.value)}
        className={control}
      >
        <option value="">جه منين — الكل</option>
        {HEARD_FROM.map((h) => (
          <option key={h.value} value={h.value}>
            {h.label}
          </option>
        ))}
      </select>

      {active && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push('/dashboard'))}
          className="min-h-[2.25rem] rounded border border-navy-line px-3 text-xs font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
        >
          امسح الفلاتر
        </button>
      )}
    </div>
  )
}
