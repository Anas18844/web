import { redirect } from 'next/navigation'
import { guardPage } from '@/lib/auth'
import { HIRING_FORM, STATUSES, TEAMS, getHiringData, type Applicant } from '@/lib/hiring'
import { Panel, Shell, Stat } from '@/components/dashboard/Shell'
import { AutoRefresh } from '@/components/dashboard/UnitExamLive'
import { HiringBoard } from '@/components/dashboard/HiringBoard'
import { toArabicDigits } from '@/lib/arabic'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'متابعة التعيين' }

/**
 * The owner's screen for the team application form (November 2026).
 *
 * Admins only: every card carries the applicant's WhatsApp number, and the
 * dashboard's rule is that phone numbers are for admins. A team account gets a
 * plain refusal instead of a screen with the numbers blanked out.
 *
 * Refreshes itself every minute. The status and note controls appear once
 * migration 016 has been run.
 */
const ar = (n: number | string) => toArabicDigits(n)

function isToday(iso: string) {
  const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
  return day(new Date(iso)) === day(new Date())
}

export default async function HiringMonitor() {
  const guard = await guardPage()
  if ('redirect' in guard) redirect(guard.redirect)
  const { user } = guard

  if (user.role !== 'admin') {
    return (
      <Shell user={user}>
        <p className="rounded border border-navy-line p-6 text-center text-sm text-ink-muted">
          شاشة التعيين للأدمن بس، لأن فيها أرقام المتقدمين.
        </p>
      </Shell>
    )
  }

  let applicants: Applicant[] = []
  let expiresAt: string | null = null
  let statusReady = false
  let failure: string | null = null
  try {
    ;({ applicants, expiresAt, statusReady } = await getHiringData())
  } catch (e) {
    failure = e instanceof Error ? e.message : String(e)
  }

  const byTeam = (t: string) => applicants.filter((a) => a.teams.includes(t)).length
  const left = expiresAt ? Date.parse(expiresAt) - Date.now() : null
  const daysLeft = left === null ? '—' : left <= 0 ? 'اتقفل' : ar(Math.ceil(left / 86_400_000))

  return (
    <Shell user={user}>
      <AutoRefresh seconds={60} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink">متابعة التعيين · فريق مستر أنس</h1>
          <p className="mt-1 text-xs text-ink-faint">
            بتتحدّث لوحدها كل دقيقة ·{' '}
            <a href={`/f/${HIRING_FORM}`} target="_blank" rel="noopener noreferrer" className="text-gold underline">
              افتح الفورم
            </a>
          </p>
        </div>
        <a
          href="/api/admin/hiring/export"
          className="rounded border border-navy-line px-3 py-2 text-xs font-bold text-ink-muted hover:text-gold"
        >
          تحميل Excel (CSV)
        </a>
      </div>

      {failure && (
        <p className="mb-6 rounded border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
          مش قادرين نقرا الإجابات: {failure}
        </p>
      )}
      {!failure && !statusReady && (
        <p className="mb-6 rounded border border-gold/40 bg-gold/10 p-3 text-xs text-gold">
          متابعة الحالة والملاحظات هتظهر بعد ما migration 016 يتشغّل في Supabase.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label="إجمالي المتقدمين" value={ar(applicants.length)} accent />
        <Stat label="النهارده" value={ar(applicants.filter((a) => isToday(a.sentAt)).length)} />
        {TEAMS.map((t) => (
          <Stat key={t} label={t} value={ar(byTeam(t))} />
        ))}
        <Stat label="معاهم لابتوب" value={ar(applicants.filter((a) => a.laptop.startsWith('أيوه')).length)} />
        <Stat label="أيام لقفل الفورم" value={daysLeft} />
      </div>

      {statusReady && applicants.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
          {Object.entries(STATUSES).map(([k, v]) => (
            <span key={k} className="rounded border border-navy-line px-2 py-1">
              {v}: {ar(applicants.filter((a) => a.decision === k).length)}
            </span>
          ))}
        </div>
      )}

      <Panel title="المتقدمين" note="الأحدث فوق. لو حد قدّم أكتر من مرة، ظاهر بآخر إجابة ليه" className="mt-6">
        <HiringBoard applicants={applicants} teams={TEAMS} statuses={STATUSES} statusReady={statusReady} />
      </Panel>
    </Shell>
  )
}
