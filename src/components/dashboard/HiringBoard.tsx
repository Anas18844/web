'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { setStatusAction } from '@/app/dashboard/hiring/actions'
import { toArabicDigits } from '@/lib/arabic'

/**
 * The applicant cards on /dashboard/hiring: filters, search, and the owner's
 * status + note per applicant. Data arrives from the server already filtered to
 * admins; nothing here decides who may see a phone number.
 */
type Status = 'new' | 'contacted' | 'interview' | 'accepted' | 'rejected'

export type BoardApplicant = {
  phone: string
  name: string
  age: string
  area: string
  status: string
  study: string
  teams: string[]
  research: string
  skills: string[]
  work: string
  servicesExp: string
  laptop: string
  times: string[]
  bio: string
  sentAt: string
  sends: number
  decision: Status
  note: string
  decidedBy: string
}

const ar = (n: number | string) => toArabicDigits(n)

const STATUS_STYLE: Record<Status, string> = {
  new: 'border-sky-400/50 text-sky-300',
  contacted: 'border-gold/50 text-gold',
  interview: 'border-violet-400/50 text-violet-300',
  accepted: 'border-emerald-400/50 text-emerald-300',
  rejected: 'border-red-400/40 text-red-300',
}

const when = (iso: string) =>
  new Date(iso).toLocaleString('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

export function HiringBoard({
  applicants,
  teams,
  statuses,
  statusReady,
}: {
  applicants: BoardApplicant[]
  teams: readonly string[]
  statuses: Record<Status, string>
  statusReady: boolean
}) {
  const [team, setTeam] = useState<string>('all')
  const [decision, setDecision] = useState<string>('all')
  const [q, setQ] = useState('')

  const shown = useMemo(() => {
    const needle = q.trim()
    return applicants.filter(
      (a) =>
        (team === 'all' || a.teams.includes(team)) &&
        (decision === 'all' || a.decision === decision) &&
        (!needle || a.name.includes(needle) || a.phone.includes(needle) || a.area.includes(needle)),
    )
  }, [applicants, team, decision, q])

  const chip = (active: boolean) =>
    `rounded border px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
      active ? 'border-gold bg-gold/10 text-gold' : 'border-navy-line text-ink-muted hover:text-gold'
    }`

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" className={chip(team === 'all')} onClick={() => setTeam('all')}>
          كل الفرق
        </button>
        {teams.map((t) => (
          <button key={t} type="button" className={chip(team === t)} onClick={() => setTeam(t)}>
            {t}
          </button>
        ))}
        {statusReady && (
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            aria-label="فلتر بالحالة"
            className="rounded border border-navy-line bg-navy-deep px-2 py-1.5 text-xs text-ink"
          >
            <option value="all">كل الحالات</option>
            {Object.entries(statuses).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="دوّر بالاسم أو الرقم أو المنطقة"
          aria-label="بحث"
          className="ms-auto w-full rounded border border-navy-line bg-navy-deep px-3 py-1.5 text-sm text-ink sm:w-72"
        />
      </div>

      <p className="mb-3 text-xs text-ink-faint">ظاهر {ar(shown.length)} من {ar(applicants.length)}</p>

      {shown.length === 0 ? (
        <p className="rounded border border-navy-line p-6 text-center text-sm text-ink-faint">
          {applicants.length === 0 ? 'لسه محدش قدّم.' : 'مفيش حد بالفلتر ده.'}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((a) => (
            <Card key={a.phone || a.sentAt} a={a} statuses={statuses} statusReady={statusReady} />
          ))}
        </div>
      )}
    </div>
  )
}

function Card({
  a,
  statuses,
  statusReady,
}: {
  a: BoardApplicant
  statuses: Record<Status, string>
  statusReady: boolean
}) {
  const [open, setOpen] = useState(false)
  const wa = a.phone ? `https://wa.me/2${a.phone}` : null

  const row = (label: string, value: string) =>
    value ? (
      <div className="flex gap-2 text-sm">
        <span className="shrink-0 text-ink-faint">{label}:</span>
        <span className="text-ink">{value}</span>
      </div>
    ) : null

  return (
    <article className="rounded border border-navy-line bg-navy-soft/30 p-4">
      <header className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-ink">{a.name || 'بدون اسم'}</h3>
          <p className="mt-0.5 text-xs text-ink-faint">
            {when(a.sentAt)}
            {a.sends > 1 && <> · قدّم {ar(a.sends)} مرات (ظاهر آخر واحدة)</>}
          </p>
        </div>
        <span className={`rounded border px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[a.decision]}`}>
          {statuses[a.decision]}
        </span>
      </header>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {a.teams.map((t) => (
          <span key={t} className="rounded bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
            {t}
          </span>
        ))}
        <span className="rounded bg-navy-line/60 px-2 py-0.5 text-xs text-ink-muted">
          {a.laptop.startsWith('أيوه') ? '💻 معاه لابتوب' : '🖥️ هينزل المعادي أو حلوان'}
        </span>
      </div>

      <div className="mt-3 space-y-1">
        {row('السن', a.age && ar(a.age))}
        {row('المنطقة', a.area)}
        {row('الحالة', [a.status, a.study].filter(Boolean).join(' · '))}
        {row('الأوقات', a.times.join('، '))}
        {row('المهارات', a.skills.join('، '))}
        {row('مشاريع وأبحاث', a.research)}
        {row('خبرة خدمة عملاء', a.servicesExp)}
        {a.work && (
          <div className="flex gap-2 text-sm">
            <span className="shrink-0 text-ink-faint">شغله:</span>
            <a href={a.work} target="_blank" rel="noopener noreferrer" dir="ltr" className="truncate text-gold underline">
              {a.work}
            </a>
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className={`whitespace-pre-line text-sm leading-relaxed text-ink-muted ${open ? '' : 'line-clamp-3'}`}>
          {a.bio}
        </p>
        {a.bio.length > 160 && (
          <button type="button" onClick={() => setOpen(!open)} className="mt-1 text-xs font-bold text-gold">
            {open ? 'أقل' : 'اقرا النبذة كلها'}
          </button>
        )}
      </div>

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-navy-line pt-3">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-500"
          >
            واتساب
          </a>
        )}
        <span dir="ltr" className="font-mono text-xs text-ink-muted">
          {a.phone}
        </span>
      </footer>

      {statusReady && a.phone && <Decision a={a} statuses={statuses} />}
    </article>
  )
}

function Decision({ a, statuses }: { a: BoardApplicant; statuses: Record<Status, string> }) {
  const [state, action, pending] = useActionState(setStatusAction, {})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!state.ok) return
    setSaved(true)
    const id = window.setTimeout(() => setSaved(false), 2000)
    return () => window.clearTimeout(id)
  }, [state])

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="phone" value={a.phone} />
      <select
        name="status"
        defaultValue={a.decision}
        aria-label={`حالة ${a.name}`}
        className="rounded border border-navy-line bg-navy-deep px-2 py-1.5 text-xs text-ink"
      >
        {Object.entries(statuses).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <input
        name="note"
        defaultValue={a.note}
        maxLength={1000}
        placeholder="ملاحظة"
        aria-label={`ملاحظة على ${a.name}`}
        className="min-w-0 flex-1 rounded border border-navy-line bg-navy-deep px-2 py-1.5 text-xs text-ink"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gold px-3 py-1.5 text-xs font-extrabold text-navy-deep disabled:opacity-60"
      >
        {pending ? '…' : saved ? 'اتحفظ ✓' : 'احفظ'}
      </button>
      {state.error && <span className="w-full text-xs text-red-300">{state.error}</span>}
    </form>
  )
}
