import { redirect } from 'next/navigation'
import { guardPage } from '@/lib/auth'
import { getUnitExamStore, type Attempt } from '@/lib/unit-exam-store'
import { UNIT_EXAM } from '@/content/unit-exam'
import { Panel, Shell, Stat } from '@/components/dashboard/Shell'
import { AutoRefresh, ExtendButton } from '@/components/dashboard/UnitExamLive'
import { toArabicDigits } from '@/lib/arabic'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'متابعة الامتحان الشامل' }

/**
 * The owner's screen while the comprehensive exam is running.
 *
 * Refreshes itself every 15 seconds. «النت قطع» means nothing has arrived from
 * that student for 3 minutes while their time is still running; «محتاج تمديد»
 * means 10 minutes. Both are prompts for a person to decide — the extension
 * itself is a button, recorded with who pressed it.
 *
 * «نفس الشبكة» groups students whose requests came from the same network. Two
 * siblings on one router, or strangers behind a mobile carrier's shared address,
 * look exactly like this too — it is for review, never a verdict.
 *
 * Phone numbers are shown to admins only, like every other screen here.
 */
const ar = (n: number | string) => toArabicDigits(n)
const OFFLINE_MS = 3 * 60_000
const NEEDS_TIME_MS = 10 * 60_000
const TOTAL = 46 // 45 questions + the bonus

type Status = 'submitted' | 'timeout' | 'offline' | 'needs_time' | 'active'
const STATUS: Record<Status, { label: string; tone: string }> = {
  submitted: { label: 'سلّم', tone: 'text-emerald-300' },
  timeout: { label: 'خلص وقته', tone: 'text-ink-faint' },
  offline: { label: 'النت قطع', tone: 'text-amber-300' },
  needs_time: { label: 'محتاج تمديد', tone: 'text-red-300' },
  active: { label: 'شغال', tone: 'text-gold' },
}

function statusOf(a: Attempt, now: number): Status {
  if (a.submitted_at) return a.end_reason === 'timeout' ? 'timeout' : 'submitted'
  if (now > Date.parse(a.ends_at)) return 'timeout'
  const silent = now - Date.parse(a.last_seen_at)
  if (silent > NEEDS_TIME_MS) return 'needs_time'
  if (silent > OFFLINE_MS) return 'offline'
  return 'active'
}

function minutes(ms: number) {
  return ar(Math.max(0, Math.floor(ms / 60_000)))
}

export default async function UnitExamMonitor() {
  const guard = await guardPage()
  if ('redirect' in guard) redirect(guard.redirect)
  const { user } = guard
  const isAdmin = user.role === 'admin'

  const store = getUnitExamStore()
  let attempts: Attempt[] = []
  let answers: Record<string, number> = {}
  let events: Record<string, Record<string, number>> = {}
  let failure: string | null = null
  try {
    ;[attempts, answers, events] = await Promise.all([
      store.listAttempts(UNIT_EXAM.slug),
      store.answerCounts(UNIT_EXAM.slug),
      store.eventCounts(UNIT_EXAM.slug),
    ])
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e)
  }

  const now = Date.now()
  const rows = attempts.map((a) => ({ a, status: statusOf(a, now) }))
  const count = (s: Status) => rows.filter((r) => r.status === s).length

  // Same network: every hash shared by more than one student.
  const byNet = new Map<string, Attempt[]>()
  for (const a of attempts) if (a.net_hash) byNet.set(a.net_hash, [...(byNet.get(a.net_hash) ?? []), a])
  const shared = [...byNet.values()].filter((g) => g.length > 1)
  const sharedIds = new Set(shared.flat().map((a) => a.id))

  return (
    <Shell user={user}>
      <AutoRefresh seconds={15} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink">متابعة الامتحان الشامل · الوحدة الأولى</h1>
          <p className="mt-1 text-xs text-ink-faint">بتتحدّث لوحدها كل ١٥ ثانية</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <a href="/api/admin/unit-exam/export?format=csv" className="rounded border border-navy-line px-3 py-2 text-xs font-bold text-ink-muted hover:text-gold">
              صدّر CSV
            </a>
            <a href="/api/admin/unit-exam/export?format=json" className="rounded border border-navy-line px-3 py-2 text-xs font-bold text-ink-muted hover:text-gold">
              صدّر JSON كامل
            </a>
          </div>
        )}
      </div>

      {failure && (
        <p className="mb-6 rounded border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
          مش قادرين نقرا بيانات الامتحان: {failure}. اتأكد إن migration 011 اتشغّل في Supabase.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Stat label="بدأوا" value={ar(attempts.length)} />
        <Stat label="شغالين دلوقتي" value={ar(count('active'))} accent />
        <Stat label="النت قطع" value={ar(count('offline'))} />
        <Stat label="محتاج تمديد" value={ar(count('needs_time'))} />
        <Stat label="سلّموا" value={ar(count('submitted'))} />
        <Stat label="خلص وقتهم" value={ar(count('timeout'))} />
      </div>

      {shared.length > 0 && (
        <Panel title="نفس الشبكة" note="للمراجعة بس: إخوات على نفس الراوتر أو شبكة موبايل مشتركة شكلهم كده بردو" className="mt-6">
          <ul className="space-y-1.5 text-sm text-ink">
            {shared.map((g) => (
              <li key={g[0].net_hash}>{g.map((a) => a.full_name).join(' · ')}</li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="الطلاب" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead>
              <tr className="border-b border-navy-line text-start text-xs text-ink-faint">
                <th className="p-2 text-start">الطالب</th>
                {isAdmin && <th className="p-2 text-start">الرقم</th>}
                <th className="p-2 text-start">النوع</th>
                <th className="p-2 text-start">الحالة</th>
                <th className="p-2 text-start">الوقت الفاضل</th>
                <th className="p-2 text-start">الإجابات</th>
                <th className="p-2 text-start">آخر حفظ</th>
                <th className="p-2 text-start">خروج من الصفحة</th>
                <th className="p-2 text-start">نسخ/لصق</th>
                <th className="p-2 text-start">الإيصال</th>
                {isAdmin && <th className="p-2" />}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ a, status }) => {
                const ev = events[a.id] ?? {}
                return (
                  <tr key={a.id} className="border-b border-navy-line/60 align-top">
                    <td className="p-2 font-bold text-ink">
                      {a.full_name}
                      {sharedIds.has(a.id) && <span className="ms-1.5 rounded bg-amber-400/15 px-1.5 text-[0.65rem] text-amber-200">نفس الشبكة</span>}
                      {a.extended_minutes > 0 && <span className="ms-1.5 text-[0.65rem] text-gold">+{ar(a.extended_minutes)} د</span>}
                    </td>
                    {isAdmin && <td className="p-2 font-mono text-ink-muted" dir="ltr">{a.phone}</td>}
                    <td className="p-2 text-ink-muted">{a.student_type === 'online' ? 'أونلاين' : 'امتحان بس'}</td>
                    <td className={`p-2 font-bold ${STATUS[status].tone}`}>{STATUS[status].label}</td>
                    <td className="p-2 text-ink">{a.submitted_at ? '—' : `${minutes(Date.parse(a.ends_at) - now)} د`}</td>
                    <td className="p-2 text-ink">{ar(answers[a.id] ?? 0)}/{ar(TOTAL)}</td>
                    <td className="p-2 text-ink-muted">من {minutes(now - Date.parse(a.last_seen_at))} د</td>
                    <td className="p-2 text-ink-muted">{ar(ev.leave ?? 0)}</td>
                    <td className="p-2 text-ink-muted">{ar((ev.copy ?? 0) + (ev.paste ?? 0) + (ev.shortcut ?? 0))}</td>
                    <td className="p-2 font-mono text-gold">{a.receipt_code ?? '—'}</td>
                    {isAdmin && (
                      <td className="p-2">{!a.submitted_at && <ExtendButton attemptId={a.id} name={a.full_name} />}</td>
                    )}
                  </tr>
                )
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-ink-faint">لسه محدش بدأ.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  )
}
