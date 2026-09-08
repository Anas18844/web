'use client'

import { useState, useTransition } from 'react'
import type { RegisterRow as Row, AttendanceStatus } from '@/lib/register-repo'
import { markAttendanceAction, recordExamMarkAction } from '@/app/dashboard/register/actions'
import { GRADE_LABELS, label } from '@/lib/dashboard-labels'
import { toArabicDigits } from '@/lib/arabic'

const ar = (n: number) => toArabicDigits(n)

const STATUSES: { value: AttendanceStatus; label: string; short: string; tone: string }[] = [
  { value: 'present', label: 'حاضر', short: 'ح', tone: 'bg-emerald-500 text-emerald-950 border-emerald-500' },
  { value: 'late', label: 'متأخر', short: 'م', tone: 'bg-amber-500 text-amber-950 border-amber-500' },
  { value: 'absent', label: 'غايب', short: 'غ', tone: 'bg-red-500 text-red-950 border-red-500' },
  { value: 'excused', label: 'بعذر', short: 'ع', tone: 'bg-sky-500 text-sky-950 border-sky-500' },
]

/**
 * One student, one row, everything the teacher needs before the lesson starts.
 *
 * The attendance buttons write IMMEDIATELY — no save button, no form. He is
 * standing in front of a class with a phone in one hand; a flow that ends in
 * "don't forget to press save" is a flow that loses a register.
 *
 * `useTransition` keeps the row responsive while the write is in flight, and
 * the chosen state is held locally so the tick appears on the tap rather than
 * after the round trip.
 */
export function RegisterRowItem({
  row,
  date,
  examSlug,
  examMarks,
  isAdmin,
}: {
  row: Row
  date: string
  examSlug: string | null
  examMarks: number
  isAdmin: boolean
}) {
  const [status, setStatus] = useState<AttendanceStatus | null>(row.status)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [markOpen, setMarkOpen] = useState(false)
  const [score, setScore] = useState(row.exam ? String(row.exam.score) : '')
  const [savingMark, setSavingMark] = useState(false)

  function choose(next: AttendanceStatus) {
    // Tapping the current state again clears it — the way out for a mis-tap,
    // without a second control to explain.
    const value = status === next ? 'clear' : next
    setStatus(value === 'clear' ? null : next)
    setError(null)

    startTransition(async () => {
      const result = await markAttendanceAction({ leadId: row.leadId, date, status: value })
      if (result.error) {
        setError(result.error)
        setStatus(row.status)
      }
    })
  }

  async function saveMark() {
    if (!examSlug) return
    const value = Number(score)
    if (!Number.isFinite(value) || value < 0) {
      setError('اكتب رقم صحيح')
      return
    }
    setSavingMark(true)
    setError(null)
    const result = await recordExamMarkAction({ leadId: row.leadId, examSlug, score: value })
    setSavingMark(false)
    if (result.error) setError(result.error)
    else setMarkOpen(false)
  }

  return (
    <li
      className={`rounded border p-4 transition-colors duration-150 ${
        status === 'absent'
          ? 'border-red-500/30 bg-red-500/[0.04]'
          : status
            ? 'border-navy-line bg-navy-soft/40'
            : 'border-navy-line bg-navy-soft/20'
      } ${pending ? 'opacity-70' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-extrabold text-ink">{row.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
            <span>{label(GRADE_LABELS, row.grade)}</span>
            {isAdmin && row.phone && (
              <>
                <span aria-hidden="true">·</span>
                <a href={`tel:${row.phone}`} dir="ltr" className="font-mono hover:text-gold">
                  {row.phone}
                </a>
              </>
            )}
          </p>
        </div>

        {/* ── Attendance ───────────────────────────────────────────────── */}
        <div className="flex shrink-0 gap-1.5">
          {STATUSES.map((s) => {
            const chosen = status === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => choose(s.value)}
                aria-pressed={chosen}
                title={s.label}
                className={`flex h-10 w-10 items-center justify-center rounded border text-sm font-extrabold transition-colors duration-150 ${
                  chosen
                    ? s.tone
                    : 'border-navy-line text-ink-faint hover:border-gold/50 hover:text-gold'
                }`}
              >
                {s.short}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Homework and exam, side by side ─────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-navy-line/60 pt-3">
        {row.homework ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-bold ${
              row.homework.passed
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            الواجب {ar(row.homework.score)}/{ar(row.homework.marks)}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-sm bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">
            ماحلّش الواجب
          </span>
        )}

        {row.exam ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-bold ${
              row.exam.passed
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            الامتحان {ar(row.exam.score)}/{ar(row.exam.marks)}
            {row.exam.source === 'manual' && (
              <span className="text-[0.65rem] font-normal opacity-70">(يدوي)</span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-sm bg-navy-line/60 px-2.5 py-1 text-xs font-bold text-ink-faint">
            مامتحنش
          </span>
        )}

        {examSlug && (
          <button
            type="button"
            onClick={() => setMarkOpen((v) => !v)}
            className="ms-auto rounded border border-navy-line px-2.5 py-1 text-xs font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
          >
            {row.exam ? 'عدّل الدرجة' : 'سجّل درجة'}
          </button>
        )}
      </div>

      {markOpen && examSlug && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-gold/40 bg-gold/[0.06] p-3">
          <label htmlFor={`mark-${row.leadId}`} className="text-xs font-bold text-ink">
            درجة الامتحان من {ar(examMarks)}
          </label>
          <input
            id={`mark-${row.leadId}`}
            type="number"
            min={0}
            max={examMarks}
            inputMode="numeric"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-20 rounded border border-navy-line bg-navy px-3 py-1.5 text-center font-mono text-sm text-ink focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={saveMark}
            disabled={savingMark}
            className="rounded bg-gold px-4 py-1.5 text-xs font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
          >
            {savingMark ? 'بنحفظ…' : 'احفظ'}
          </button>
          <button
            type="button"
            onClick={() => setMarkOpen(false)}
            className="text-xs font-bold text-ink-faint hover:text-ink"
          >
            إلغاء
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-300">
          {error}
        </p>
      )}
    </li>
  )
}
