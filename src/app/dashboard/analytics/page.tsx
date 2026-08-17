import Link from 'next/link'
import { redirect } from 'next/navigation'
import { guardPage } from '@/lib/auth'
import { getStats } from '@/lib/leads-repo'
import { Panel, Shell, Stat } from '@/components/dashboard/Shell'
import { BarList, DailyChart, FUNNEL, SERIES, Trend } from '@/components/dashboard/Charts'
import {
  ATTENDANCE_LABELS,
  BRANCH_LABELS,
  GRADE_LABELS,
  HEARD_FROM_LABELS,
  STATUSES,
  label,
} from '@/lib/dashboard-labels'
import { toArabicDigits } from '@/lib/arabic'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'التحليلات' }

/**
 * Admin only.
 *
 * Not because the numbers are secret — they contain no personal data at all —
 * but because this is the screen decisions get made from, and a decision made
 * from a number nobody can be held to is worse than no decision. One person
 * owns this view.
 *
 * Nothing here reads a name or a phone number. `getStats` selects only the
 * columns it counts, so this page could not leak a student's details if it
 * tried.
 */
export default async function AnalyticsPage() {
  const guard = await guardPage()
  if ('redirect' in guard) redirect(guard.redirect)
  const { user } = guard
  // The second lock. The link to this page is only rendered for an admin, but
  // a URL typed into a bar does not care what was rendered.
  if (user.role !== 'admin') redirect('/dashboard')

  const stats = await getStats()
  const ar = (n: number) => toArabicDigits(n)

  const completionRate =
    stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0

  return (
    <Shell user={user}>
      <nav className="mb-5">
        <Link
          href="/dashboard"
          className="text-xs font-bold text-gold transition-colors duration-200 hover:text-ink"
        >
          ← رجوع لقائمة الطلبة
        </Link>
      </nav>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="كل الطلبة"
          value={ar(stats.total)}
          accent
          hint={<Trend current={stats.last7} previous={stats.previous7} />}
        />
        <Stat
          label="كمّلوا الفورم"
          value={`${ar(completionRate)}٪`}
          hint={
            <span className="text-xs text-ink-faint">
              {ar(stats.complete)} كامل · {ar(stats.partial)} ناقص
            </span>
          }
        />
        <Stat
          label="من الموقع"
          value={ar(stats.fromWebsite)}
          hint={<span className="text-xs text-ink-faint">سجّلوا بنفسهم</span>}
        />
        <Stat
          label="إضافة يدوية"
          value={ar(stats.fromManual)}
          hint={<span className="text-xs text-ink-faint">واتساب أو تليفون أو سنتر</span>}
        />
      </section>

      <div className="mt-4">
        <Panel
          title="التسجيلات يوم بيوم"
          note="آخر ٣٠ يوم، مقسّمة بالصف — عشان تشوف أنهي سنة بتيجي فعلاً"
        >
          <DailyChart points={stats.daily} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="جم منين؟" note="اللي الطالب نفسه قاله — ده الرقم الوحيد اللي بيشوف الكلام الشفهي">
          <BarList
            rows={Object.entries(stats.byHeardFrom)
              .filter(([k]) => k !== 'unknown')
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => ({ label: label(HEARD_FROM_LABELS, k), value: v }))}
          />
        </Panel>

        <Panel title="وصلوا لفين في المتابعة؟" note="اللون بيتغمّق مع كل خطوة للأمام">
          <BarList
            rows={STATUSES.map((s, i) => ({
              label: s.label,
              value: stats.byStatus[s.value] ?? 0,
              color: FUNNEL[i],
            }))}
            total={stats.total}
          />
        </Panel>

        <Panel title="الصف">
          <BarList
            rows={Object.entries(stats.byGrade)
              .filter(([k]) => k !== 'unknown')
              .map(([k, v]) => ({
                label: label(GRADE_LABELS, k),
                value: v,
                color: k === 'second_bacc' ? SERIES.second : SERIES.first,
              }))}
          />
        </Panel>

        <Panel title="أونلاين ولا سنتر؟" note="بيتسأل في الخطوة التانية بس">
          <BarList
            rows={Object.entries(stats.byAttendance)
              .filter(([k]) => k !== 'unknown')
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => ({ label: label(ATTENDANCE_LABELS, k), value: v }))}
            emptyLabel="مفيش حد كمّل الخطوة التانية لسه"
          />
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="الفروع" note="لطلاب السنتر بس">
            <BarList
              rows={Object.entries(stats.byBranch)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => ({ label: label(BRANCH_LABELS, k), value: v }))}
              emptyLabel="مفيش طلبة سنتر لسه"
            />
          </Panel>
        </div>
      </div>

      {/*
        The part most dashboards leave out. Every number above has a boundary,
        and someone about to make an expensive decision from them is owed the
        boundaries in writing rather than having to infer them.
      */}
      <section className="mt-6 rounded border border-navy-line bg-navy-soft/30 p-5">
        <h2 className="text-sm font-extrabold text-ink">اقرا الأرقام دي بحذر</h2>
        <ul className="mt-3 grid gap-2.5 text-xs leading-relaxed text-ink-muted">
          <li>
            <span className="font-bold text-ink">«جم منين» ناقص دايماً.</span> السؤال ده في
            الخطوة التانية من الفورم، يعني الـ{ar(stats.partial)} اللي وقفوا في النص مش
            محسوبين فيه. المصادر بتبان أصغر من حقيقتها، مش أكبر.
          </li>
          <li>
            <span className="font-bold text-ink">الإضافة اليدوية مش تحويل من الموقع.</span>{' '}
            الـ{ar(stats.fromManual)} دول جم من الواتساب أو التليفون. لو حسبتهم مع تحويلات
            الموقع، هتفتكر الموقع بيشتغل أحسن مما هو فعلاً.
          </li>
          <li>
            <span className="font-bold text-ink">الأرقام الصغيرة مابتقولش اتجاه.</span> فرق
            بين ٣ و٦ في أسبوع مش «زيادة ١٠٠٪» — ده صدفة في أغلب الأحيان. عشان كده النسب
            المئوية مابتظهرش هنا غير لما الأسبوع اللي فات يبقى ١٠ أو أكتر.
          </li>
          <li>
            <span className="font-bold text-ink">التسجيل مش اشتراك.</span> الرقم الكبير فوق
            هو ناس سابت رقمها، مش ناس دفعت. «اشترك» في قائمة المتابعة هو الرقم الوحيد اللي
            معناه فلوس.
          </li>
        </ul>
      </section>
    </Shell>
  )
}
