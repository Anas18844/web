import { redirect } from 'next/navigation'
import Link from 'next/link'
import { guardPage } from '@/lib/auth'
import { getStats, listLeads } from '@/lib/leads-repo'
import { Panel, Shell, Stat } from '@/components/dashboard/Shell'
import { BarList, FUNNEL, Trend } from '@/components/dashboard/Charts'
import { Filters } from '@/components/dashboard/Filters'
import { LeadTable } from '@/components/dashboard/LeadTable'
import { AddLead } from '@/components/dashboard/AddLead'
import {
  HEARD_FROM_LABELS,
  STATUSES,
  STATUS_LABELS,
  label,
} from '@/lib/dashboard-labels'
import { toArabicDigits } from '@/lib/arabic'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'الطلبة' }

/**
 * The list, and the four numbers worth seeing before it.
 *
 * ⚠️ This page is authoritative for access, not the middleware in front of it.
 * `getSessionUser` re-reads the account from the database on every request, so
 * a deactivated login stops working here immediately rather than whenever its
 * cookie happens to expire.
 *
 * The role goes into `listLeads`, which builds its SELECT from it. A team
 * session's phone columns are never fetched, so there is nothing in the
 * response for a browser devtools panel to reveal. Hiding a column would not
 * have been a rule, only a suggestion.
 */
export default async function DashboardPage({
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

  const filters = {
    q: one('q'),
    grade: one('grade'),
    status: one('status'),
    stage: one('stage'),
    source: one('source'),
    heardFrom: one('heardFrom'),
  }

  const [leads, stats] = await Promise.all([listLeads(user.role, filters), getStats()])

  const isAdmin = user.role === 'admin'
  const ar = (n: number) => toArabicDigits(n)
  const filtered = Object.values(filters).some(Boolean)

  return (
    <Shell user={user} toolbar={<Filters values={filters} />}>
      {/* ── The four numbers ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="كل الطلبة"
          value={ar(stats.total)}
          accent
          hint={<Trend current={stats.last7} previous={stats.previous7} />}
        />
        <Stat
          label="سجّلوا الفورم كامل"
          value={ar(stats.complete)}
          hint={
            <span className="text-xs text-ink-faint">
              و{ar(stats.partial)} وقفوا في نص الفورم — دول أرقام حقيقية ينفع نكلّمها
            </span>
          }
        />
        <Stat
          label="آخر ٧ أيام"
          value={ar(stats.last7)}
          hint={<span className="text-xs text-ink-faint">الأسبوع اللي قبله {ar(stats.previous7)}</span>}
        />
        <Stat
          label="اتسجّلوا يدوي"
          value={ar(stats.fromManual)}
          hint={
            <span className="text-xs text-ink-faint">
              من {ar(stats.total)} — الباقي جه من الموقع
            </span>
          }
        />
      </section>

      {/* ── Where they came from, and where they got to ──────────────────── */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="جم منين؟" note="اللي الطالب نفسه قاله — مش تخمين من التحليلات">
          <BarList
            rows={Object.entries(stats.byHeardFrom)
              .filter(([key]) => key !== 'unknown')
              .sort((a, b) => b[1] - a[1])
              .map(([key, value]) => ({ label: label(HEARD_FROM_LABELS, key), value }))}
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
      </section>

      {isAdmin && (
        <p className="mt-4 text-xs text-ink-faint">
          فيه رسوم بيانية أكتر في{' '}
          <Link href="/dashboard/analytics" className="font-bold text-gold hover:underline">
            صفحة التحليلات
          </Link>
          .
        </p>
      )}

      {/* ── The list ─────────────────────────────────────────────────────── */}
      <section className="mt-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-ink">
              {filtered ? 'نتيجة الفلترة' : 'كل الطلبة'}
            </h2>
            <p className="mt-1 text-xs text-ink-faint">
              {ar(leads.length)} من {ar(stats.total)}
              {leads.length >= 500 && ' — بنعرض أول ٥٠٠، فلتر عشان توصل لأبعد'}
            </p>
          </div>

          <AddLead />
        </header>

        <LeadTable leads={leads} isAdmin={isAdmin} />
      </section>

      {!isAdmin && (
        <p className="mt-6 rounded border border-navy-line bg-navy-soft/40 p-4 text-xs leading-relaxed text-ink-muted">
          الحساب ده مابيشوفش أرقام التليفونات. الأرقام مش مخبّية في الصفحة — هي أصلاً
          مابتتحمّلش من الداتابيز للحساب ده. لو محتاج رقم طالب، اطلبه من الأدمن.
        </p>
      )}
    </Shell>
  )
}
