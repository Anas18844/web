import Link from 'next/link'
import { redirect } from 'next/navigation'
import { guardPage } from '@/lib/auth'
import { getRegister, summarise } from '@/lib/register-repo'
import { cairoToday, planFor, weekOf, weeksSoFar } from '@/lib/weeks'
import { GRADES, type Grade } from '@/content/site'
import { Panel, Shell, Stat } from '@/components/dashboard/Shell'
import { RegisterRowItem } from '@/components/dashboard/RegisterRow'
import { RegisterFilters } from '@/components/dashboard/RegisterFilters'
import { toArabicDigits } from '@/lib/arabic'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'كشف الحضور' }

const ar = (n: number) => toArabicDigits(n)

/**
 * كشف الحضور — the screen the teacher works from before a lesson.
 *
 * Organised by WEEK, because that is the question asked of it: "week 3 — who is
 * here, who did last week's homework, what did they get on last week's paper".
 * The week is chosen once and everything on the page answers for that week;
 * see lib/weeks.ts for why the homework and the paper are the previous week's.
 *
 * Marking is a single tap that writes immediately. There is no save button,
 * because a register that can be lost by navigating away is worse than paper.
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const guard = await guardPage()
  if ('redirect' in guard) redirect(guard.redirect)
  const { user } = guard

  const params = await searchParams
  const one = (k: string) => {
    const v = params[k]
    return typeof v === 'string' && v ? v : undefined
  }

  // The week being taught unless another is asked for — and never a future one.
  const current = weekOf(cairoToday())
  const requested = Number(one('week'))
  const week = Number.isInteger(requested) && requested >= 1 && requested <= current ? requested : current

  // تانية بكالوريا by default: it is the only grade with centre classes (BIZ-07).
  const gradeParam = one('grade')
  const grade: Grade = GRADES.some((g) => g.value === gradeParam)
    ? (gradeParam as Grade)
    : 'second_bacc'

  const filters = { grade, attendance: one('attendance'), branch: one('branch') }
  const plan = planFor(grade, week)

  const { rows, attendanceError, unmatched } = await getRegister(user.role, plan, filters)
  const stats = summarise(rows)

  return (
    <Shell
      user={user}
      toolbar={
        <RegisterFilters
          values={{ week: String(week), grade, attendance: filters.attendance, branch: filters.branch }}
          weeks={weeksSoFar()}
        />
      }
    >
      <nav className="mb-5 flex flex-wrap items-center gap-4 text-xs font-bold">
        <Link href="/dashboard" className="text-gold transition-colors duration-200 hover:text-ink">
          ← قائمة الطلبة
        </Link>
        {user.role === 'admin' && (
          <Link
            href="/dashboard/analytics"
            className="text-ink-faint transition-colors duration-200 hover:text-gold"
          >
            التحليلات
          </Link>
        )}
      </nav>

      {/* The week, stated once at the top, with what it contains. */}
      <header className="mb-5 rounded border border-gold/30 bg-gold/[0.05] p-4 sm:p-5">
        <p className="text-xs font-bold text-gold">
          {plan.dateLabel}
          {week === current && ' · الأسبوع الحالي'}
        </p>
        <h1 className="mt-1 text-xl font-extrabold text-ink">{plan.name}</h1>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-faint">الحضور</dt>
            <dd className="font-bold text-ink">حصة {plan.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">الواجب اللي بيتراجع</dt>
            <dd className="font-bold text-ink">
              {plan.homework ? `${plan.homework.label} · من ${ar(plan.homework.marks)}` : 'مفيش واجب الأسبوع ده'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">الامتحان</dt>
            <dd className="font-bold text-ink">
              {plan.exam ? `${plan.exam.label} · من ${ar(plan.exam.marks)}` : 'مفيش امتحان الأسبوع ده'}
            </dd>
          </div>
        </dl>
      </header>

      {/* A missing table must not look like an empty class. */}
      {attendanceError && (
        <div
          role="alert"
          className="mb-5 rounded border border-red-500/40 bg-red-500/10 p-4 text-sm leading-relaxed text-red-100"
        >
          <p className="font-bold">التحضير مش هيتسجّل — جدول الحضور مش موجود.</p>
          <p className="mt-1.5 text-red-100/80">
            {/* <bdi> isolates the filename from the surrounding RTL run. */}
            شغّل <bdi className="font-mono" dir="ltr">008_register.sql</bdi> في Supabase.
          </p>
          <p className="mt-1.5 font-mono text-xs text-red-100/60">{attendanceError}</p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="حاضر" value={ar(stats.present + stats.late)} accent
          hint={stats.late ? <span className="text-xs text-ink-faint">منهم {ar(stats.late)} متأخر</span> : undefined}
        />
        <Stat label="غايب" value={ar(stats.absent)} />
        <Stat
          label="لسه ماتسجّلش"
          value={ar(stats.unmarked)}
          hint={<span className="text-xs text-ink-faint">من {ar(stats.total)}</span>}
        />
        <Stat
          label={plan.homework ? `حلّوا ${plan.homework.label}` : 'الواجب'}
          value={plan.homework ? ar(stats.didHomework) : '—'}
          hint={
            plan.homework ? (
              <span className="text-xs text-ink-faint">{ar(stats.total - stats.didHomework)} ماحلّوش</span>
            ) : undefined
          }
        />
        <Stat
          label={plan.exam ? `اتسجّلهم ${plan.exam.label}` : 'الامتحان'}
          value={plan.exam ? ar(stats.satExam) : '—'}
          hint={
            plan.exam ? (
              <span className="text-xs text-ink-faint">من {ar(stats.total)}</span>
            ) : undefined
          }
        />
      </section>

      <div className="mt-6">
        <Panel
          title={`كشف ${plan.name}`}
          note="الضغط على نفس زرار الحضور تاني بيمسحه. كل حاجة بتتحفظ على طول."
        >
          {rows.length === 0 ? (
            <p className="py-6 text-sm text-ink-faint">
              مفيش طلبة بالفلاتر دي. شيل شوية فلاتر أو ضيف طالب من قائمة الطلبة.
            </p>
          ) : (
            <ul className="grid gap-3">
              {rows.map((row) => (
                <RegisterRowItem
                  key={row.leadId}
                  row={row}
                  week={week}
                  grade={grade}
                  homeworkLabel={plan.homework?.label ?? null}
                  exam={plan.exam ? { label: plan.exam.label, marks: plan.exam.marks } : null}
                  isAdmin={user.role === 'admin'}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/*
        Submissions that match no student. Last on the page because they are
        the exception — but on the page, because without them a student who did
        the homework on a different phone number reads as «ماحلّش» above.
      */}
      {unmatched.length > 0 && plan.homework && (
        <div className="mt-6">
          <Panel
            title={`${ar(unmatched.length)} حلّوا ${plan.homework.label} برقم مش في قائمة الطلبة`}
            note="غالبًا رقم أخ أو ولي أمر، أو غلطة في الكتابة. لو واحد منهم طالب عندك، صحّح رقمه في قائمة الطلبة وهيتربط لوحده."
          >
            <ul className="grid gap-2">
              {unmatched.map((u, i) => (
                <li
                  key={`${u.phone ?? u.name ?? 'anon'}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-navy-line bg-navy-soft/20 px-4 py-2.5 text-sm"
                >
                  <span className="font-bold text-ink">{u.name || 'من غير اسم'}</span>
                  <span className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
                    {u.phone && (
                      <bdi dir="ltr" className="font-mono">
                        {u.phone}
                      </bdi>
                    )}
                    <span className="font-bold text-ink-muted">
                      {ar(u.score)}/{ar(u.marks)}
                    </span>
                    {u.attempts > 1 && <span>{ar(u.attempts)} محاولات</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </Shell>
  )
}
