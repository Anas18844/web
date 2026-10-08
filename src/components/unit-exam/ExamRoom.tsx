'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toArabicDigits } from '@/lib/arabic'
import type {
  Answers,
  AnswerValue,
  CompareItem,
  ExamItem,
  GapItem,
  NestedItem,
  PublicUnitExam,
  TfItem,
  TimelineItem,
} from './types'

/**
 * The exam room — the paper, the timer, the map, and the hand-in.
 *
 * Time: `endsAt` and `serverNow` come from the server. The device clock is only
 * used to measure elapsed time from the moment the page loaded, so changing the
 * phone's clock moves nothing.
 *
 * Saving: every change is written to this device at once (localStorage) with a
 * revision number, then sent to /api/unit-exam/save — at once for a pick, two
 * seconds after the student stops typing. Anything that fails waits in a queue
 * and is retried every five seconds and when the network returns. On a resume
 * the device copy and the server copy are merged: the higher revision wins.
 *
 * Copying: selection, the context menu, copy/cut and paste are blocked, and
 * the paper is hidden when printed. A watermark with the student's name and
 * number sits over the questions so a photographed page can be traced.
 */
const ar = (n: number | string) => toArabicDigits(n)
const LETTERS = ['أ', 'ب', 'ج', 'د']
const LEVELS = ['١', '٢', '٣', '٤']
const WARN_AT = [30, 10, 5] // minutes left
const SCALES = [1, 1.12, 1.25]

type ServerAnswer = { id: string; value: AnswerValue | null; rev: number; flagged: boolean }

type Props = {
  exam: PublicUnitExam
  student: { name: string; phone: string }
  endsAt: number
  serverNow: number
  /** Where this attempt is kept on the device. */
  storageKey: string
  /** The attempt pass. Without it (the preview) nothing leaves the device. */
  token?: string
  /** What the server already has for this attempt. */
  initial?: ServerAnswer[]
  /** Set when the attempt was already handed in. */
  receipt?: string | null
  preview?: boolean
}

type Kept = { answers: Answers; flags: Record<string, boolean>; revs: Record<string, number> }

export function ExamRoom({ exam, student, endsAt, serverNow, storageKey, token, initial, receipt: initialReceipt, preview }: Props) {
  // ── answers, flags and revisions: device copy merged with the server's ──
  const [answers, setAnswers] = useState<Answers>({})
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [restored, setRestored] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(initialReceipt ?? null)
  const [closedByServer, setClosedByServer] = useState(false)

  // Server end of the attempt; grows if the dashboard gives extra time.
  const [end, setEnd] = useState(endsAt)
  const answersRef = useRef<Answers>({})
  const flagsRef = useRef<Record<string, boolean>>({})
  const revs = useRef<Record<string, number>>({})
  const pending = useRef<Set<string>>(new Set())
  const [pendingCount, setPendingCount] = useState(0)
  const [online, setOnline] = useState(true)
  const [lastOk, setLastOk] = useState<number | null>(null)

  useEffect(() => {
    let local: Kept = { answers: {}, flags: {}, revs: {} }
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) local = { answers: {}, flags: {}, revs: {}, ...JSON.parse(raw) }
    } catch {
      /* private mode or corrupt copy: the server copy still stands */
    }
    const a: Answers = { ...local.answers }
    const f: Record<string, boolean> = { ...local.flags }
    const r: Record<string, number> = { ...local.revs }
    const p = new Set<string>(Object.keys(r))
    for (const s of initial ?? []) {
      if ((r[s.id] ?? 0) <= s.rev) {
        a[s.id] = s.value ?? undefined
        f[s.id] = s.flagged
        r[s.id] = s.rev
        p.delete(s.id) // the server already has this version (or a newer one)
      }
    }
    answersRef.current = a
    flagsRef.current = f
    revs.current = r
    pending.current = token ? p : new Set()
    setAnswers(a)
    setFlags(f)
    setPendingCount(pending.current.size)
    setRestored(true)
  }, [storageKey, initial, token])

  const keep = useCallback(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ answers: answersRef.current, flags: flagsRef.current, revs: revs.current, at: Date.now() }),
      )
    } catch {
      /* storage full or blocked: the server save still runs */
    }
  }, [storageKey])

  // ── sending to the server ──────────────────────────────────────────────
  const inFlight = useRef(false)
  const flushTimer = useRef<number | null>(null)

  const flush = useCallback(async (): Promise<boolean> => {
    if (!token) return true
    if (inFlight.current) return false
    const ids = [...pending.current].slice(0, 60)
    if (!ids.length) return true
    inFlight.current = true
    const sent = ids.map((id) => ({ id, value: answersRef.current[id] ?? null, rev: revs.current[id] ?? 1, flagged: Boolean(flagsRef.current[id]) }))
    try {
      const res = await fetch('/api/unit-exam/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, changes: sent }),
        keepalive: true,
      })
      if (res.status === 409) {
        setClosedByServer(true)
        pending.current.clear()
      } else if (res.ok) {
        const data = (await res.json().catch(() => null)) as { endsAt?: number } | null
        // An extension given from the dashboard arrives with the next save.
        if (data?.endsAt) setEnd((e) => (data.endsAt! > e ? data.endsAt! : e))
        for (const s of sent) if (revs.current[s.id] === s.rev) pending.current.delete(s.id)
        setOnline(true)
        setLastOk(Date.now())
      } else {
        setOnline(false)
      }
    } catch {
      setOnline(false)
    } finally {
      inFlight.current = false
      setPendingCount(pending.current.size)
    }
    return pending.current.size === 0
  }, [token])

  const schedule = useCallback(
    (ms: number) => {
      if (flushTimer.current) window.clearTimeout(flushTimer.current)
      flushTimer.current = window.setTimeout(() => void flush(), ms)
    },
    [flush],
  )

  // Retry whatever is waiting: every 5 s, when the network comes back, and when
  // the page is about to be hidden.
  useEffect(() => {
    if (!token) return
    const retry = window.setInterval(() => pending.current.size && void flush(), 5000)
    // Heartbeat: tells the dashboard the student is still here, and brings any extension.
    const beat = window.setInterval(() => {
      if (pending.current.size || document.visibilityState !== 'visible') return
      void fetch('/api/unit-exam/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, changes: [] }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.endsAt && setEnd((e) => (d.endsAt > e ? d.endsAt : e)))
        .catch(() => undefined)
    }, 60_000)
    const back = () => { setOnline(true); void flush(); report('online') }
    const gone = () => { setOnline(false); report('offline') }
    window.addEventListener('online', back)
    window.addEventListener('offline', gone)
    return () => {
      window.clearInterval(beat)
      window.clearInterval(retry)
      window.removeEventListener('online', back)
      window.removeEventListener('offline', gone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, flush])

  // ── events for the review ──────────────────────────────────────────────
  const report = useCallback(
    (type: string, detail?: Record<string, string | number>) => {
      if (!token) return
      void fetch('/api/unit-exam/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type, detail }),
        keepalive: true,
      }).catch(() => undefined)
    },
    [token],
  )

  const leftAt = useRef<number | null>(null)
  const [leaveNote, setLeaveNote] = useState(false)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        leftAt.current = Date.now()
        keep()
        void flush()
      } else if (leftAt.current) {
        const seconds = Math.round((Date.now() - leftAt.current) / 1000)
        leftAt.current = null
        if (seconds >= 2) {
          report('leave', { seconds })
          setLeaveNote(true)
        }
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [keep, flush, report])

  // ── the clock ──────────────────────────────────────────────────────────
  const loadedAt = useRef<number>(0)
  // The preview has no server attempt, so it keeps its own end on the device —
  // a refresh then behaves like a real resume: same answers, same time left.
  useEffect(() => {
    if (!preview) return setEnd(endsAt)
    try {
      const kept = Number(localStorage.getItem(`${storageKey}:endsAt`))
      if (kept > 0) setEnd(kept)
      else localStorage.setItem(`${storageKey}:endsAt`, String(endsAt))
    } catch {
      /* keep the server value */
    }
  }, [preview, storageKey, endsAt])
  const [left, setLeft] = useState(() => Math.max(0, endsAt - serverNow))
  const [warning, setWarning] = useState<number | null>(null)
  const warned = useRef<Set<number>>(new Set())

  useEffect(() => {
    loadedAt.current = performance.now()
    const tick = () => {
      const now = serverNow + (performance.now() - loadedAt.current)
      const ms = Math.max(0, end - now)
      setLeft(ms)
      const minutes = Math.ceil(ms / 60000)
      for (const w of WARN_AT) {
        if (minutes <= w && ms > 0 && !warned.current.has(w)) {
          // Only the most urgent applies if the page opened late.
          WARN_AT.filter((x) => x >= w).forEach((x) => warned.current.add(x))
          setWarning(w)
        }
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [end, serverNow])

  const timeUp = left === 0 || closedByServer
  const submitted = receipt !== null
  const locked = timeUp || submitted

  // When time runs out: one last push of anything still waiting.
  const timeUpSent = useRef(false)
  useEffect(() => {
    if (timeUp && restored && !timeUpSent.current) {
      timeUpSent.current = true
      void flush()
      report('time_up')
    }
  }, [timeUp, restored, flush, report])

  // ── reading comfort ────────────────────────────────────────────────────
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const s = Number(localStorage.getItem('unit-exam:scale') ?? 0)
    if (s >= 0 && s < SCALES.length) setScale(s)
  }, [])
  const cycleScale = () => {
    const s = (scale + 1) % SCALES.length
    setScale(s)
    try {
      localStorage.setItem('unit-exam:scale', String(s))
    } catch {
      /* not important */
    }
  }

  // ── no copy ────────────────────────────────────────────────────────────
  const [blockedNote, setBlockedNote] = useState<string | null>(null)
  const block = (what: string, kind: 'copy' | 'paste' = 'copy') => (e: React.SyntheticEvent) => {
    e.preventDefault()
    setBlockedNote(what)
    report(kind)
    window.setTimeout(() => setBlockedNote(null), 2500)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'p', 's', 'a', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        setBlockedNote('الاختصار ده مقفول أثناء الامتحان')
        report('shortcut', { key: e.key.toLowerCase() })
        window.setTimeout(() => setBlockedNote(null), 2500)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [report])

  // ── answering ──────────────────────────────────────────────────────────
  const touch = (id: string, delay: number) => {
    revs.current[id] = (revs.current[id] ?? 0) + 1
    pending.current.add(id)
    setPendingCount(pending.current.size)
    keep()
    schedule(delay)
  }
  const set = (id: string, value: AnswerValue) => {
    if (locked) return
    answersRef.current = { ...answersRef.current, [id]: value }
    setAnswers(answersRef.current)
    // A pick is sent almost at once; typing waits until the student pauses.
    touch(id, typeof value === 'number' ? 300 : 2000)
  }
  const toggleFlag = (id: string) => {
    if (locked) return
    flagsRef.current = { ...flagsRef.current, [id]: !flagsRef.current[id] }
    setFlags(flagsRef.current)
    touch(id, 800)
  }

  const all = useMemo(() => [{ id: 'bonus', n: 0 } as const, ...exam.items], [exam.items])
  const isAnswered = (item: { id: string }) => answered(exam.items.find((i) => i.id === item.id), answers[item.id])
  const done = all.filter(isAnswered).length

  const [mapOpen, setMapOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [handing, setHanding] = useState<'idle' | 'busy' | 'failed'>('idle')
  const jump = (id: string) => {
    setMapOpen(false)
    setConfirmOpen(false)
    document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handIn = async () => {
    if (!token) {
      setReceipt('معاينة')
      return
    }
    setHanding('busy')
    // Everything on the device reaches the server BEFORE the attempt is closed.
    for (let i = 0; i < 6 && pending.current.size; i++) {
      if (!(await flush())) await new Promise((r) => setTimeout(r, 1500))
    }
    if (pending.current.size && !closedByServer) return setHanding('failed')
    try {
      const res = await fetch('/api/unit-exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!data.ok) return setHanding('failed')
      setReceipt(data.receipt)
      window.scrollTo(0, 0)
    } catch {
      setHanding('failed')
    }
  }

  const minutesLeft = Math.floor(left / 60000)
  const clock = `${ar(String(Math.floor(left / 3600000)).padStart(1, '0'))}:${ar(
    String(minutesLeft % 60).padStart(2, '0'),
  )}:${ar(String(Math.floor((left % 60000) / 1000)).padStart(2, '0'))}`

  const saveLabel = !token
    ? '✓ اتحفظ على الجهاز'
    : pendingCount === 0
      ? lastOk || restored ? '✓ اتحفظ' : '…'
      : online
        ? '⏳ بيتحفظ…'
        : `⏳ ${ar(pendingCount)} مستنية النت`

  if (submitted) {
    return <Finished student={student} done={done} total={all.length} reason="submitted" receipt={receipt} />
  }

  return (
    <div
      className="unit-exam relative"
      style={{ ['--exam-scale' as string]: SCALES[scale] }}
      onCopy={block('النسخ ممنوع أثناء الامتحان')}
      onCut={block('النسخ ممنوع أثناء الامتحان')}
      onContextMenu={block('القائمة دي مقفولة أثناء الامتحان')}
    >
      <style>{EXAM_CSS}</style>

      {/* ── sticky bar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-navy-line bg-navy-deep/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 sm:px-5">
          <div
            role="timer"
            className={`rounded px-3 py-1.5 text-lg font-extrabold tabular-nums ${
              left <= 5 * 60000 ? 'bg-red-600 text-white' : 'bg-navy-soft text-ink'
            }`}
          >
            {clock}
          </div>
          <span role="status" className={`text-xs font-bold ${pendingCount && !online ? 'text-red-400' : 'text-ink-muted'}`}>
            {saveLabel}
          </span>
          <div className="ms-auto flex items-center gap-2">
            <button type="button" onClick={cycleScale} className="exam-btn" aria-label="كبّر الخط">
              Aa
            </button>
            <button type="button" onClick={() => setMapOpen(true)} className="exam-btn">
              الخريطة {ar(done)}/{ar(all.length)}
            </button>
          </div>
        </div>
        {preview && (
          <p className="bg-gold/15 py-1 text-center text-xs font-bold text-gold">
            معاينة على جهازك بس · الإجابات متتبعتش لأي مكان
          </p>
        )}
      </div>

      {warning !== null && !timeUp && (
        <div role="alert" className="mx-auto mt-3 max-w-3xl px-3 sm:px-5">
          <div className="flex items-center justify-between rounded border border-gold/50 bg-gold/10 px-4 py-3">
            <p className="font-extrabold text-ink">فاضل {ar(warning)} دقيقة على نهاية الامتحان</p>
            <button type="button" className="text-sm font-bold text-gold" onClick={() => setWarning(null)}>
              تمام
            </button>
          </div>
        </div>
      )}

      {leaveNote && !locked && (
        <div role="alert" className="mx-auto mt-3 max-w-3xl px-3 sm:px-5">
          <div className="flex items-center justify-between rounded border border-red-500/50 bg-red-500/10 px-4 py-3">
            <p className="text-sm font-bold text-ink">خروجك من صفحة الامتحان اتسجّل. خليك في الصفحة لحد ما تسلّم.</p>
            <button type="button" className="text-sm font-bold text-gold" onClick={() => setLeaveNote(false)}>تمام</button>
          </div>
        </div>
      )}

      {timeUp && (
        <div role="alert" className="mx-auto mt-3 max-w-3xl px-3 sm:px-5">
          <div className="rounded border border-red-500/60 bg-red-500/10 px-4 py-3 font-extrabold text-ink">
            الوقت انتهى، وإجاباتك اتحفظت. مش هتقدر تعدّل حاجة، ودوس «سلّم» تحت عشان تاخد كود الإيصال.
          </div>
        </div>
      )}

      {blockedNote && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <p className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg">{blockedNote}</p>
        </div>
      )}

      {/* ── the paper ───────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-3xl px-3 pb-24 pt-5 sm:px-5">
        <Watermark text={`${student.name} · ${student.phone}`} />

        <section id="q-bonus" className="exam-q scroll-mt-28 border-dashed border-gold/60 bg-gold/[0.06]">
          <p className="exam-stem text-gold">
            {exam.bonus.title} <span className="exam-mark">[{exam.bonus.mark}]</span>
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {exam.bonus.options.map((o, j) => (
              <Choice key={o} name="bonus" letter={LETTERS[j]} text={o} checked={answers.bonus === j}
                disabled={locked} onPick={() => set('bonus', j)} />
            ))}
          </div>
        </section>

        {exam.sections.map((sec) => {
          const items = exam.items.filter((i) => i.section === sec.key)
          return (
            <div key={sec.key} className="mt-9">
              <h2 className="exam-sec">
                <span className="exam-sec-n">{ar(sec.n)}</span>
                <span className="flex-1">{sec.title}</span>
                <span className="text-sm text-gold">{sec.marks}</span>
              </h2>
              {items.map((item) => (
                <Question key={item.id} item={item} flagged={Boolean(flags[item.id])} onFlag={() => toggleFlag(item.id)}>
                  <Body item={item} value={answers[item.id]} disabled={locked} onChange={(v) => set(item.id, v)}
                    onPaste={block('اللصق ممنوع: اكتب إجابتك بنفسك', 'paste')} />
                </Question>
              ))}
            </div>
          )
        })}

        <div className="mt-9">
          <h2 className="exam-sec">
            <span className="flex-1">مسودة</span>
            <span className="text-sm text-ink-muted">للكتابة والحساب · لا تُصحَّح</span>
          </h2>
          <textarea className="exam-input min-h-48" disabled={locked} value={String(answers.draft ?? '')}
            onChange={(e) => set('draft', e.target.value)} onPaste={block('اللصق ممنوع', 'paste')} />
        </div>

        {!submitted && (
          <button type="button" onClick={() => (timeUp ? void handIn() : setConfirmOpen(true))}
            className="mt-10 w-full rounded bg-gold py-4 text-lg font-extrabold text-navy-deep">
            سلّم الامتحان
          </button>
        )}
      </div>

      {/* ── the map ─────────────────────────────────────────────────────── */}
      {mapOpen && (
        <Sheet title="خريطة الأسئلة" onClose={() => setMapOpen(false)}>
          <div className="mb-3 flex flex-wrap gap-3 text-xs font-bold text-ink-muted">
            <span><i className="exam-dot bg-gold" /> اتجاوب</span>
            <span><i className="exam-dot border border-navy-line" /> لسه</span>
            <span><i className="exam-dot bg-sky-500" /> أراجعه بعدين</span>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {all.map((it) => {
              const ok = isAnswered(it)
              const fl = flags[it.id]
              return (
                <button key={it.id} type="button" onClick={() => jump(it.id)}
                  className={`relative h-11 rounded text-sm font-extrabold ${
                    ok ? 'bg-gold text-navy-deep' : 'border border-navy-line text-ink'
                  }`}>
                  {it.n === 0 ? '🎁' : ar(it.n)}
                  {fl && <span className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-sky-500" />}
                </button>
              )
            })}
          </div>
        </Sheet>
      )}

      {/* ── confirm hand-in ─────────────────────────────────────────────── */}
      {confirmOpen && (
        <Sheet title="هتسلّم الامتحان؟" onClose={() => setConfirmOpen(false)}>
          <p className="text-body text-ink">
            جاوبت <b>{ar(done)}</b> من <b>{ar(all.length)}</b>. بعد التسليم مش هتقدر تعدّل.
          </p>
          {all.filter((it) => !isAnswered(it) || flags[it.id]).length > 0 && (
            <>
              <p className="mt-4 text-sm font-bold text-ink-muted">لسه متجاوبتش أو عليها «أراجعه بعدين»:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {all.filter((it) => !isAnswered(it) || flags[it.id]).map((it) => (
                  <button key={it.id} type="button" onClick={() => jump(it.id)}
                    className={`rounded px-3 py-1.5 text-sm font-extrabold ${
                      flags[it.id] && isAnswered(it) ? 'bg-sky-500/20 text-ink' : 'border border-navy-line text-ink'
                    }`}>
                    {it.n === 0 ? 'البونص' : `سؤال ${ar(it.n)}`}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="exam-btn h-12" onClick={() => setConfirmOpen(false)}>
              ارجع للامتحان
            </button>
            <button type="button" className="h-12 rounded bg-gold font-extrabold text-navy-deep disabled:opacity-60"
              disabled={handing === 'busy'} onClick={() => void handIn()}>
              {handing === 'busy' ? 'بيتسلّم…' : 'سلّم نهائيًا'}
            </button>
          </div>
          {handing === 'failed' && (
            <p role="alert" className="mt-3 text-sm font-bold text-red-400">
              التسليم موصلش، غالبًا النت. إجاباتك محفوظة؛ اتأكد من النت ودوس «سلّم نهائيًا» تاني.
            </p>
          )}
        </Sheet>
      )}
    </div>
  )
}

// ═══════════════════════════════ question frame ═══════════════════════════════

function Question({ item, flagged, onFlag, children }: {
  item: ExamItem; flagged: boolean; onFlag: () => void; children: React.ReactNode
}) {
  return (
    <section id={`q-${item.id}`} className="exam-q scroll-mt-28">
      <div className="mb-3 flex items-center gap-2">
        <span className="exam-n">{ar(item.n)}</span>
        {'star' in item && item.star && <span className="rounded bg-gold px-2 py-0.5 text-xs font-extrabold text-navy-deep">★ سؤال التميّز</span>}
        <span className="exam-mark">[{markLabel(item.marks)}]</span>
        <button type="button" onClick={onFlag}
          className={`ms-auto rounded px-2.5 py-1 text-xs font-bold ${flagged ? 'bg-sky-500 text-white' : 'border border-navy-line text-ink-muted'}`}>
          {flagged ? '✓ هراجعه' : 'أراجعه بعدين'}
        </button>
      </div>
      {children}
    </section>
  )
}

function Body({ item, value, disabled, onChange, onPaste }: {
  item: ExamItem; value: AnswerValue | undefined; disabled: boolean
  onChange: (v: AnswerValue) => void; onPaste: (e: React.ClipboardEvent) => void
}) {
  switch (item.type) {
    case 'mcq':
      return (
        <>
          <p className="exam-stem">{item.stem}</p>
          <div className="mt-3 grid gap-2">
            {(item.optionOrder ?? item.options.map((_, i) => i)).map((orig, pos) => (
              <Choice key={orig} name={item.id} letter={LETTERS[pos]} text={item.options[orig]} checked={value === orig}
                disabled={disabled} onPick={() => onChange(orig)} />
            ))}
          </div>
        </>
      )
    case 'tf':
      return <TfBody item={item} value={value as { judge: 'T' | 'F' | ''; fix: string } | undefined}
        disabled={disabled} onChange={onChange} onPaste={onPaste} />
    case 'term':
      return (
        <>
          <p className="exam-stem">{item.stem}</p>
          <input className="exam-input mt-3" placeholder="اكتب المصطلح" disabled={disabled}
            value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} onPaste={onPaste} />
        </>
      )
    case 'gap':
      return <GapBody item={item} value={value as string[] | undefined} disabled={disabled} onChange={onChange} onPaste={onPaste} />
    case 'nested':
      return <NestedBody item={item} value={value as { names: string[]; ex: string[] } | undefined}
        disabled={disabled} onChange={onChange} onPaste={onPaste} />
    case 'timeline':
      return <TimelineBody item={item} value={value as string[] | undefined} disabled={disabled} onChange={onChange} />
    case 'compare':
      return <CompareBody item={item} value={value as string[][] | undefined} disabled={disabled} onChange={onChange} onPaste={onPaste} />
  }
}

function TfBody({ item, value, disabled, onChange, onPaste }: {
  item: TfItem; value: { judge: 'T' | 'F' | ''; fix: string } | undefined; disabled: boolean
  onChange: (v: AnswerValue) => void; onPaste: (e: React.ClipboardEvent) => void
}) {
  const v = value ?? { judge: '', fix: '' }
  return (
    <>
      <p className="exam-stem">
        <u className="decoration-gold decoration-2 underline-offset-4">{item.term}</u>: {item.definition}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(['T', 'F'] as const).map((j) => (
          <button key={j} type="button" disabled={disabled} onClick={() => onChange({ ...v, judge: j })}
            className={`h-12 rounded border text-lg font-extrabold ${
              v.judge === j ? 'border-gold bg-gold text-navy-deep' : 'border-navy-line text-ink'
            }`}>
            {j === 'T' ? '✓ صح' : '✗ خطأ'}
          </button>
        ))}
      </div>
      {v.judge === 'F' && (
        <input className="exam-input mt-2" placeholder="المصطلح الصحيح بدل اللي تحته خط" disabled={disabled}
          value={v.fix} onChange={(e) => onChange({ ...v, fix: e.target.value })} onPaste={onPaste} />
      )}
    </>
  )
}

function GapBody({ item, value, disabled, onChange, onPaste }: {
  item: GapItem; value: string[] | undefined; disabled: boolean
  onChange: (v: AnswerValue) => void; onPaste: (e: React.ClipboardEvent) => void
}) {
  const v = value ?? Array(item.parts.length - 1).fill('')
  return (
    <p className="exam-stem leading-[2.6]">
      {item.parts.map((part, j) => (
        <span key={j}>
          {part}
          {j < item.parts.length - 1 && (
            <input aria-label={`الفراغ ${ar(j + 1)}`} className="exam-gap" disabled={disabled} value={v[j] ?? ''}
              placeholder={`(${ar(j + 1)})`} onPaste={onPaste}
              onChange={(e) => { const n = [...v]; n[j] = e.target.value; onChange(n) }} />
          )}
        </span>
      ))}
    </p>
  )
}

function NestedBody({ item, value, disabled, onChange, onPaste }: {
  item: NestedItem; value: { names: string[]; ex: string[] } | undefined; disabled: boolean
  onChange: (v: AnswerValue) => void; onPaste: (e: React.ClipboardEvent) => void
}) {
  const v = value ?? { names: ['', '', '', ''], ex: item.examples.map(() => '') }
  const box = (j: number): React.ReactNode => (
    <div className={`rounded-lg border p-2.5 ${j === 3 ? 'border-gold bg-gold/10' : 'border-navy-line bg-navy-soft'}`}>
      <div className="flex items-center gap-2">
        <span className="exam-n !h-7 !w-7 !text-sm">{LEVELS[j]}</span>
        <input className="exam-input !py-2" placeholder="اسم المستوى" disabled={disabled} value={v.names[j]}
          onPaste={onPaste} onChange={(e) => { const n = [...v.names]; n[j] = e.target.value; onChange({ ...v, names: n }) }} />
      </div>
      {j < 3 && <div className="mt-2.5">{box(j + 1)}</div>}
    </div>
  )
  return (
    <>
      <p className="exam-stem">{item.stem}</p>
      <p className="mt-4 text-sm font-bold text-ink-muted">(أ) أسماء المستويات</p>
      <div className="mt-2">{box(0)}</div>
      <p className="mt-5 text-sm font-bold text-ink-muted">(ب) اختار رقم أصغر مستوى لكل مثال</p>
      <div className="mt-2 grid gap-2">
        {item.examples.map((ex, j) => (
          <div key={ex} className="flex items-center gap-2 rounded border border-navy-line p-2.5">
            <span className="flex-1 font-bold text-ink">{ex}</span>
            <div className="flex gap-1.5">
              {LEVELS.map((l) => (
                <button key={l} type="button" disabled={disabled}
                  onClick={() => { const n = [...v.ex]; n[j] = l; onChange({ ...v, ex: n }) }}
                  className={`h-10 w-10 rounded font-extrabold ${v.ex[j] === l ? 'bg-gold text-navy-deep' : 'border border-navy-line text-ink'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function TimelineBody({ item, value, disabled, onChange }: {
  item: TimelineItem; value: string[] | undefined; disabled: boolean; onChange: (v: AnswerValue) => void
}) {
  const v = value ?? item.slots.map(() => '')
  return (
    <>
      <p className="exam-stem">{item.stem}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {item.cards.map((c) => (
          <div key={c.key} className="flex gap-2.5 rounded border border-navy-line bg-navy-soft p-3">
            <span className="exam-n !h-7 !w-7 shrink-0 !bg-gold !text-sm !text-navy-deep">{c.key}</span>
            <span className="text-[calc(0.95rem*var(--exam-scale))] leading-relaxed text-ink">{c.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        {item.slots.map((s, j) => (
          <div key={s} className="flex items-center gap-2 border-r-4 border-gold ps-3">
            <span className="flex-1 font-bold text-ink">{s}</span>
            <select className="exam-input !w-28 !py-2 text-center font-extrabold" disabled={disabled} value={v[j]}
              onChange={(e) => { const n = [...v]; n[j] = e.target.value; onChange(n) }}>
              <option value="">—</option>
              {item.cards.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
            </select>
          </div>
        ))}
      </div>
    </>
  )
}

function CompareBody({ item, value, disabled, onChange, onPaste }: {
  item: CompareItem; value: string[][] | undefined; disabled: boolean
  onChange: (v: AnswerValue) => void; onPaste: (e: React.ClipboardEvent) => void
}) {
  const v = value ?? item.rows.map(() => item.columns.map(() => ''))
  return (
    <>
      <p className="exam-stem whitespace-pre-line">{item.stem.replace(/ \((أ|ب)\) /g, '\n($1) ').replace(' قال المدير', '\nقال المدير')}</p>
      <div className="mt-4 grid gap-4">
        {item.rows.map((row, r) => (
          <div key={row} className="rounded border border-navy-line p-3">
            <p className="font-extrabold text-gold">{row}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {item.columns.map((col, c) => (
                <label key={col} className="block">
                  <span className="mb-1 block text-sm font-bold text-ink-muted">{col}</span>
                  <textarea className="exam-input min-h-28" disabled={disabled} value={v[r][c]} onPaste={onPaste}
                    onChange={(e) => { const n = v.map((x) => [...x]); n[r][c] = e.target.value; onChange(n) }} />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ═══════════════════════════════ small parts ═══════════════════════════════

function Choice({ name, letter, text, checked, disabled, onPick }: {
  name: string; letter: string; text: string; checked: boolean; disabled: boolean; onPick: () => void
}) {
  return (
    <label className={`flex min-h-12 cursor-pointer items-start gap-3 rounded border px-3 py-2.5 ${
      checked ? 'border-gold bg-gold/15' : 'border-navy-line'} ${disabled ? 'cursor-default opacity-80' : ''}`}>
      <input type="radio" name={name} className="mt-1.5 h-4 w-4 accent-[#CBA352]" checked={checked}
        disabled={disabled} onChange={onPick} />
      <span className="exam-opt"><b className="text-gold">{letter})</b> {text}</span>
    </label>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-navy-deep p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="exam-btn" aria-label="اقفل">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div className="exam-wm">
        {Array.from({ length: 60 }, (_, i) => <span key={i}>{text}</span>)}
      </div>
    </div>
  )
}

function Finished({ student, done, total, reason, receipt }: {
  student: { name: string }; done: number; total: number; reason: 'submitted' | 'timeout'; receipt?: string | null
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 text-center">
      <div className="card p-8">
        <p className="text-4xl">✅</p>
        <h1 className="mt-3 text-title font-extrabold text-ink">
          {reason === 'submitted' ? 'اتسلّم امتحانك' : 'الوقت انتهى، وإجاباتك اتحفظت'}
        </h1>
        <p className="mt-3 text-body text-ink-muted">
          {student.name}، جاوبت {ar(done)} من {ar(total)}. النتيجة هتوصلك على الواتساب بعد التصحيح.
        </p>
        {receipt && (
          <div className="mt-6 rounded border border-gold/50 bg-gold/10 p-4">
            <p className="text-sm font-bold text-ink-muted">كود الإيصال · صوّره واحتفظ بيه</p>
            <p dir="ltr" className="mt-1 text-3xl font-extrabold tracking-[0.3em] text-gold">{receipt}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════ helpers ═══════════════════════════════

function markLabel(m: number) {
  return m === 1 ? 'درجة' : m === 2 ? 'درجتان' : `${ar(m)} درجات`
}

/** Has the student put something real in this question? */
function answered(item: ExamItem | undefined, v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return false
  if (!item) return typeof v === 'number' // the bonus
  switch (item.type) {
    case 'mcq':
      return typeof v === 'number'
    case 'tf': {
      const t = v as { judge: string; fix: string }
      return t.judge === 'T' || (t.judge === 'F' && t.fix.trim() !== '')
    }
    case 'term':
      return String(v).trim() !== ''
    case 'gap':
    case 'timeline':
      return (v as string[]).every((x) => x && x.trim() !== '')
    case 'nested': {
      const t = v as { names: string[]; ex: string[] }
      return t.names.every((x) => x.trim()) && t.ex.every((x) => x)
    }
    case 'compare':
      return (v as string[][]).every((r) => r.every((x) => x.trim()))
  }
}

const EXAM_CSS = `
.unit-exam .exam-q{position:relative;z-index:0;margin-top:1rem;border:1px solid rgb(var(--navy-line));border-radius:.75rem;padding:1rem;background:rgb(var(--navy-soft)/.35)}
.unit-exam .exam-stem,.unit-exam .exam-opt{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.unit-exam .exam-stem{font-size:calc(1.06rem*var(--exam-scale));font-weight:700;line-height:1.9;color:rgb(var(--ink))}
.unit-exam .exam-opt{font-size:calc(1rem*var(--exam-scale));line-height:1.7;color:rgb(var(--ink))}
.unit-exam .exam-n{display:inline-grid;place-items:center;width:2rem;height:2rem;border-radius:999px;border:2px solid rgb(var(--ink)/.6);font-weight:800;color:rgb(var(--ink))}
.unit-exam .exam-mark{font-size:.8rem;font-weight:800;color:#CBA352}
.unit-exam .exam-sec{display:flex;align-items:center;gap:.6rem;border-inline-start:4px solid #CBA352;background:rgb(var(--navy-soft));border-radius:.5rem;padding:.7rem .9rem;font-size:calc(1.1rem*var(--exam-scale));font-weight:800;color:rgb(var(--ink))}
.unit-exam .exam-sec-n{display:inline-grid;place-items:center;width:1.7rem;height:1.7rem;border-radius:999px;background:#CBA352;color:#0D1B33;font-size:.9rem}
.unit-exam .exam-input{width:100%;border:1px solid rgb(var(--navy-line));border-radius:.5rem;background:#0A1526;color:rgb(var(--ink));padding:.75rem .9rem;font-size:calc(1rem*var(--exam-scale));line-height:1.7}
.unit-exam .exam-input:focus,.unit-exam .exam-gap:focus{outline:2px solid #CBA352;outline-offset:1px}
.unit-exam .exam-gap{display:inline-block;width:11rem;max-width:70%;margin:0 .3rem;border:0;border-bottom:2px solid #CBA352;background:transparent;color:rgb(var(--ink));text-align:center;font-weight:800;font-size:calc(1rem*var(--exam-scale))}
.unit-exam .exam-btn{border:1px solid rgb(var(--navy-line));border-radius:.5rem;padding:.4rem .75rem;font-size:.85rem;font-weight:800;color:rgb(var(--ink))}
.unit-exam .exam-dot{display:inline-block;width:.8rem;height:.8rem;border-radius:.25rem;vertical-align:middle;margin-inline-end:.25rem}
.unit-exam .exam-wm{position:absolute;inset:-20%;display:flex;flex-wrap:wrap;gap:4rem 3rem;transform:rotate(-24deg);opacity:.06;font-weight:800;font-size:.95rem;color:rgb(var(--ink));white-space:nowrap}
@media print{.unit-exam{display:none!important}body::after{content:'طباعة الامتحان ممنوعة';display:block;padding:4rem;text-align:center;font-size:2rem}}
`
