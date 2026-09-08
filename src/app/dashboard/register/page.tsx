import Link from 'next/link'
import { redirect } from 'next/navigation'
import { guardPage } from '@/lib/auth'
import { getRegister, summarise } from '@/lib/register-repo'
import { EXAMS, totalMarks } from '@/content/exams'
import { Panel, Shell, Stat } from '@/components/dashboard/Shell'
import { RegisterRowItem } from '@/components/dashboard/RegisterRow'
import { RegisterFilters } from '@/components/dashboard/RegisterFilters'
import { toArabicDigits } from '@/lib/arabic'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'كشف الحضور' }

const ar = (n: number) => toArabicDigits(n)

/** Local date, not UTC — a 9pm lesson in Cairo must not file itself under tomorrow. */
function today(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

/**
 * كشف الحضور — the screen the teacher works from before a lesson.
 *
 * Four facts per student on one line: who they are, are they here, did they do
 * the homework and what did they get, and their exam mark. Marking is a single
 * tap that writes immediately; there is no save button, because a register that
 * can be lost by navigating away is worse than paper.
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

  const date = one('date') ?? today()
  const filters = { grade: one('grade'), attendance: one('attendance'), branch: one('branch') }

  const { rows, attendanceError } = await getRegister(user.role, date, filters)
  const stats = summarise(rows)

  // Which exam a hand-entered mark belongs to. One exam today, so it is the
  // default rather than a question — the teacher can change it if there are
  // ever two.
  const examSlug = one('exam') ?? EXAMS[0]?.slug ?? null
  const exam = EXAMS.find((e) => e.slug === examSlug) ?? null

  return (
    <Shell
      user={user}
      toolbar={
        <RegisterFilters
          values={{ ...filters, date, exam: examSlug ?? '' }}
          exams={EXAMS.map((e) => ({ slug: e.slug, title: e.title }))}
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

      {/* A missing table must not look like an empty class. */}
      {attendanceError && (
        <div
          role="alert"
          className="mb-5 rounded border border-red-500/40 bg-red-500/10 p-4 text-sm leading-relaxed text-red-100"
        >
          <p className="font-bold">التحضير مش هيتسجّل — جدول الحضور مش موجود.</p>
          <p className="mt-1.5 text-red-100/80">
            {/* <bdi> isolates the filename from the surrounding RTL run. Without
                it the browser reorders it to "register.sql_008" — a name that
                does not exist, in an instruction telling someone to run it. */}
            شغّل <bdi className="font-mono" dir="ltr">008_register.sql</bdi> في Supabase.
            الأسماء والواجب والامتحان تحت صحيحين، بس أي ضغطة تحضير هتفشل.
          </p>
          <p className="mt-1.5 font-mono text-xs text-red-100/60">{attendanceError}</p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="حاضر" value={ar(stats.present)} accent />
        <Stat label="متأخر" value={ar(stats.late)} />
        <Stat label="غايب" value={ar(stats.absent)} />
        <Stat
          label="لسه ماتسجّلش"
          value={ar(stats.unmarked)}
          hint={<span className="text-xs text-ink-faint">من {ar(stats.total)}</span>}
        />
        <Stat
          label="حلّوا الواجب"
          value={ar(stats.didHomework)}
          hint={
            <span className="text-xs text-ink-faint">
              {ar(stats.total - stats.didHomework)} لأ
            </span>
          }
        />
      </section>

      <div className="mt-6">
        <Panel
          title={`كشف ${date}`}
          note={
            exam
              ? `تسجيل الدرجات على: ${exam.title} — من ${ar(totalMarks(exam))}`
              : 'مفيش امتحان متاح لتسجيل الدرجات'
          }
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
                  date={date}
                  examSlug={exam?.slug ?? null}
                  examMarks={exam ? totalMarks(exam) : 0}
                  isAdmin={user.role === 'admin'}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="mt-5 rounded border border-navy-line bg-navy-soft/40 p-4 text-xs leading-relaxed text-ink-muted">
        الضغط على نفس الزرار تاني بيمسح التسجيل. كل تعديل بيتحفظ على طول — مفيش زرار
        حفظ. «الواجب» و«الامتحان» بيتحدّثوا لوحدهم لما الطالب يحلّهم على الموقع.
      </p>
    </Shell>
  )
}
