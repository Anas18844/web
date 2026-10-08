'use client'

import { useEffect, useState } from 'react'
import { toArabicDigits } from '@/lib/arabic'
import { nameError } from '@/lib/name'
import { ExamRoom } from './ExamRoom'
import { Dua } from './Dua'
import type { AnswerValue, PublicUnitExam } from './types'

/**
 * The way in: name, number, kind of student — then the exam room.
 *
 * A pass from an earlier visit on this device is tried first, so a student whose
 * page crashed lands straight back in the exam. On another device they type the
 * same name and number and the server returns the same attempt.
 */
type Open = {
  token: string
  attempt: { id: string; name: string; phone: string; endsAt: number; submitted: boolean; receipt: string | null }
  serverNow: number
  paper: PublicUnitExam
  answers: { id: string; value: AnswerValue | null; rev: number; flagged: boolean }[]
}

const PASS_KEY = 'unit-exam:pass:unit-1'
const NAME_HINT = {
  empty: 'اكتب اسمك',
  not_arabic: 'اكتب اسمك بالحروف العربي',
  not_triple: 'اكتب اسمك الثلاثي: اسمك واسم والدك واسم جدك',
} as const

export function UnitExamEntry({ late, discount }: { late: boolean; discount: number }) {
  const [open, setOpen] = useState<Open | null>(null)
  const [checking, setChecking] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<'online' | 'exam_only' | ''>('')
  const [consent, setConsent] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start(body: Record<string, unknown>) {
    const res = await fetch('/api/unit-exam/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return (await res.json()) as ({ ok: true } & Open) | { ok: false; reason: string; message: string }
  }

  // Back on the same device: walk straight in.
  useEffect(() => {
    let token: string | null = null
    try {
      token = localStorage.getItem(PASS_KEY)
    } catch {
      /* no storage: use the form */
    }
    if (!token) return setChecking(false)
    start({ token })
      .then((r) => {
        if (r.ok) setOpen(r)
        else localStorage.removeItem(PASS_KEY)
      })
      .catch(() => undefined)
      .finally(() => setChecking(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    const problem = nameError(name)
    if (problem) return setError(NAME_HINT[problem])
    if (!type) return setError('اختار: طالب أونلاين عندنا، ولا جاي تمتحن بس؟')
    if (!accepted) return setError('علّم على «قريت القواعد وموافق» الأول')
    setBusy(true)
    try {
      const r = await start({ name, phone, type, consent, accepted: true })
      if (r.ok) {
        try {
          localStorage.setItem(PASS_KEY, r.token)
        } catch {
          /* resume will need the form */
        }
        setOpen(r)
      } else {
        setError(r.message)
      }
    } catch {
      setError('مش قادرين نوصل للموقع دلوقتي. اتأكد إن النت شغّال وجرّب تاني.')
    } finally {
      setBusy(false)
    }
  }

  if (open) {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-navy-deep">
        <ExamRoom
          exam={open.paper}
          student={{ name: open.attempt.name, phone: open.attempt.phone }}
          endsAt={open.attempt.endsAt}
          serverNow={open.serverNow}
          storageKey={`unit-exam:answers:${open.attempt.id}`}
          token={open.token}
          initial={open.answers}
          receipt={open.attempt.submitted ? open.attempt.receipt ?? '—' : null}
        />
      </div>
    )
  }

  if (checking) {
    return <p className="py-6 text-center font-bold text-ink-muted">بنتأكد لو عندك امتحان مفتوح…</p>
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="ue-name" className="mb-2 block text-sm font-bold text-ink">الاسم الثلاثي بالعربي</label>
        <input id="ue-name" className="w-full rounded border border-navy-line bg-navy-deep px-4 py-3 text-lg text-ink"
          autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد محمد علي" />
      </div>
      <div>
        <label htmlFor="ue-phone" className="mb-2 block text-sm font-bold text-ink">رقم الموبايل أو الواتساب</label>
        <input id="ue-phone" dir="ltr" inputMode="tel" className="w-full rounded border border-navy-line bg-navy-deep px-4 py-3 text-lg text-ink"
          autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
        <p className="mt-1.5 text-xs text-ink-muted">النتيجة هتوصلك على الرقم ده. ولو رجعت للامتحان، ادخل بنفس الاسم والرقم.</p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">إنت…</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            ['online', 'طالب أونلاين عندنا'],
            ['exam_only', 'جاي أمتحن بس'],
          ] as const).map(([v, label]) => (
            <label key={v} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded border px-4 ${type === v ? 'border-gold bg-gold/15' : 'border-navy-line'}`}>
              <input type="radio" name="ue-type" className="h-4 w-4 accent-[#CBA352]" checked={type === v} onChange={() => setType(v)} />
              <span className="font-bold text-ink">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {type === 'exam_only' && (
        <label className="flex items-start gap-3 rounded border border-navy-line p-4">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#CBA352]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span className="text-sm leading-relaxed text-ink-muted">
            موافق إنكم تتواصلوا معايا على الرقم ده بالنتيجة، وبعرض خصم {toArabicDigits(discount)}٪ على باقة الشهر والترم لو قفلت الامتحان.
          </span>
        </label>
      )}
      <label className="flex items-start gap-3 rounded border border-navy-line p-4">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#CBA352]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span className="text-sm font-bold leading-relaxed text-ink">قريت القواعد وتنبيه الذكاء الاصطناعي، وموافق.</span>
      </label>

      <Dua />

      {error && <p role="alert" className="rounded bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</p>}

      <button type="submit" disabled={busy}
        className="w-full rounded bg-gold py-4 text-lg font-extrabold text-navy-deep disabled:opacity-60">
        {busy ? 'لحظة…' : late ? 'كمّل امتحاني' : 'ابدأ الامتحان · الساعتين هيبدأوا دلوقتي'}
      </button>
      {late && <p className="text-center text-xs text-ink-muted">وقت بداية امتحان جديد خلص. اللي بدأ قبل كده يقدر يكمّل بنفس اسمه ورقمه.</p>}
    </form>
  )
}
