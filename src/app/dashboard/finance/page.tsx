import Link from 'next/link'
import { redirect } from 'next/navigation'
import { guardPage } from '@/lib/auth'
import { getFinance } from '@/lib/finance-repo'
import { PHASE_LABELS, computeFinance, type MonthResult } from '@/lib/finance'
import { Panel, Shell, Stat } from '@/components/dashboard/Shell'
import { MonthForm, SettingsForm } from '@/components/dashboard/FinanceForms'
import { toArabicDigits } from '@/lib/arabic'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'الحسابات' }

/**
 * Admin only, and more strictly than analytics: the prices on this page are
 * never said in public (BIZ-12), so a team account must not be able to reach
 * it even by typing the URL.
 *
 * Read top to bottom it answers three questions in order: are we making money
 * this season, month by month where does it come from and go, and what did
 * actually happen next to what we planned.
 */

const money = (n: number) =>
  `${n < 0 ? '−' : ''}${toArabicDigits(Math.round(Math.abs(n)).toLocaleString('en-US')).replace(/,/g, '٬')}`

const hours = (n: number) => toArabicDigits(String(Math.round(n * 10) / 10))

type Row = {
  label: string
  value: (m: MonthResult) => number | null
  total?: number | null
  format?: (n: number) => string
  tone?: 'head' | 'sum' | 'result'
  signed?: boolean
}

function Cell({ value, row }: { value: number | null; row: Row }) {
  if (value === null) return <span className="text-ink-faint">—</span>
  const text = (row.format ?? money)(value)
  const color = row.signed ? (value < 0 ? 'text-red-300' : 'text-emerald-300') : ''
  return <span className={color}>{text}</span>
}

export default async function FinancePage() {
  const guard = await guardPage()
  if ('redirect' in guard) redirect(guard.redirect)
  const { user } = guard
  if (user.role !== 'admin') redirect('/dashboard')

  const data = await getFinance()
  const result = computeFinance(data.settings, data.records)
  const { months, totals } = result

  const thisMonth = new Date().toISOString().slice(0, 7)
  const current = months.find((m) => m.key === thisMonth) ?? months[0]
  const firstProfit = months.find((m) => m.profit >= 0)
  const lowestCash = months.reduce((low, m) => (m.cash.balance < low.cash.balance ? m : low))

  const fixedNames = Array.from(new Set(months.flatMap((m) => m.costs.fixed.map((f) => f.name))))
  const fixedOf = (m: MonthResult, name: string) =>
    m.costs.fixed.find((f) => f.name === name)?.amount ?? 0

  const sum = (pick: (m: MonthResult) => number) => months.reduce((a, m) => a + pick(m), 0)

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'الإيراد (الصافي بعد نسبة المنصة، ومتوزع على شهوره)',
      rows: [
        { label: 'باقة الشهر', value: (m) => m.revenue.monthly, total: sum((m) => m.revenue.monthly) },
        { label: 'الترم', value: (m) => m.revenue.term, total: sum((m) => m.revenue.term) },
        { label: 'السنة', value: (m) => m.revenue.year, total: sum((m) => m.revenue.year) },
        { label: 'المراجعات', value: (m) => m.revenue.revision, total: sum((m) => m.revenue.revision) },
        { label: 'السنتر', value: (m) => m.revenue.center, total: sum((m) => m.revenue.center) },
        { label: 'إجمالي الإيراد', value: (m) => m.revenue.total, total: totals.revenue, tone: 'sum' },
      ],
    },
    {
      title: 'المصروفات',
      rows: [
        {
          label: 'ساعات التصوير',
          value: (m) => m.hours.total,
          total: sum((m) => m.hours.total),
          format: hours,
        },
        { label: 'الاستوديو', value: (m) => m.costs.studio, total: sum((m) => m.costs.studio) },
        { label: 'المونتاج', value: (m) => m.costs.editing, total: sum((m) => m.costs.editing) },
        ...fixedNames.map((name) => ({
          label: name,
          value: (m: MonthResult) => fixedOf(m, name),
          total: sum((m) => fixedOf(m, name)),
        })),
        { label: 'إجمالي المصروفات', value: (m) => m.costs.total, total: totals.costs, tone: 'sum' },
      ],
    },
    {
      title: 'النتيجة',
      rows: [
        { label: 'صافي الربح', value: (m) => m.profit, total: totals.profit, tone: 'result', signed: true },
        { label: 'الربح التراكمي', value: (m) => m.cumulative, signed: true },
        {
          label: 'طلاب باقة الشهر للتعادل',
          value: (m) => m.breakEven,
          format: (n) => toArabicDigits(n),
        },
      ],
    },
    {
      title: 'السيولة (المنصة بتحوّل يوم ٥ من الشهر اللي بعده)',
      rows: [
        { label: 'فلوس داخلة', value: (m) => m.cash.in, total: sum((m) => m.cash.in) },
        { label: 'فلوس خارجة', value: (m) => m.cash.out, total: sum((m) => m.cash.out) },
        { label: 'الرصيد', value: (m) => m.cash.balance, signed: true },
      ],
    },
    {
      title: 'الفعلي',
      rows: [
        {
          label: 'إيراد فعلي',
          value: (m) => m.actual?.revenue ?? null,
          total: totals.actualMonths ? totals.actualRevenue : null,
        },
        {
          label: 'مصروف فعلي',
          value: (m) => m.actual?.costs ?? null,
          total: totals.actualMonths ? totals.actualCosts : null,
        },
        {
          label: 'ربح فعلي',
          value: (m) => m.actual?.profit ?? null,
          total: totals.actualMonths ? totals.actualProfit : null,
          signed: true,
          tone: 'result',
        },
        {
          label: 'الفرق عن الخطة',
          value: (m) => (m.actual ? m.actual.profit - m.profit : null),
          signed: true,
        },
      ],
    },
  ]

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

      {data.problem && (
        <p
          role="alert"
          className="mb-5 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
        >
          {data.problem} الأرقام اللي تحت هي الافتراضات الأساسية، ومفيش حاجة هتتحفظ.
        </p>
      )}
      {!data.problem && !data.settingsSaved && (
        <p className="mb-5 rounded border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink-muted">
          دي الأرقام اللي اتفقنا عليها يوم ٢٠٢٦-٠٩-٢٨. عدّلها من «الافتراضات» تحت واحفظ.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="ربح الموسم المتوقع"
          value={money(totals.profit)}
          accent
          hint={
            <span className="text-xs text-ink-faint">
              إيراد {money(totals.revenue)} · مصروف {money(totals.costs)}
            </span>
          }
        />
        <Stat
          label={`التعادل في ${current.label}`}
          value={current.breakEven === null ? '—' : `${toArabicDigits(current.breakEven)} طالب`}
          hint={<span className="text-xs text-ink-faint">على باقة الشهر، بعد السنتر والباقات التانية</span>}
        />
        <Stat
          label="أول شهر فيه ربح"
          value={firstProfit ? firstProfit.label : 'مفيش'}
          hint={<span className="text-xs text-ink-faint">حسب الخطة الحالية</span>}
        />
        <Stat
          label="أقل رصيد"
          value={money(lowestCash.cash.balance)}
          hint={
            <span className="text-xs text-ink-faint">
              في {lowestCash.label}. ده اللي محتاج تغطيه من برّه
            </span>
          }
        />
      </section>

      <p className="mt-3 text-xs text-ink-faint">
        خطة التصوير: {hours(result.plannedHours.month)} ساعة في الشهر ≈{' '}
        {hours(result.plannedHours.week)} في الأسبوع.
      </p>

      <Panel title="الموسم شهر بشهر" note="الخطة من «شهر بشهر» تحت" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse text-sm">
            <thead>
              <tr className="text-xs text-ink-faint">
                <th className="sticky start-0 bg-navy-deep p-2 text-start font-bold" />
                {months.map((m) => (
                  <th key={m.key} className="p-2 text-end font-bold">
                    <span className="block text-ink">{m.label}</span>
                    <span className="block font-normal">
                      {PHASE_LABELS[m.phase]}
                      {m.weight !== 1 && ` · ${toArabicDigits(Math.round(m.weight * 100))}٪`}
                    </span>
                  </th>
                ))}
                <th className="p-2 text-end font-bold text-gold">الموسم</th>
              </tr>
            </thead>
            {sections.map((section) => (
              <tbody key={section.title}>
                <tr>
                  <td
                    colSpan={months.length + 2}
                    className="border-t border-navy-line px-2 pb-1 pt-4 text-xs font-extrabold text-gold"
                  >
                    {section.title}
                  </td>
                </tr>
                {section.rows.map((row) => (
                  <tr
                    key={row.label}
                    className={
                      row.tone === 'sum' || row.tone === 'result'
                        ? 'border-t border-navy-line font-extrabold'
                        : ''
                    }
                  >
                    <td className="sticky start-0 whitespace-nowrap bg-navy-deep p-2 text-ink-muted">
                      {row.label}
                    </td>
                    {months.map((m) => (
                      <td key={m.key} className="whitespace-nowrap p-2 text-end font-mono text-ink">
                        <Cell value={row.value(m)} row={row} />
                      </td>
                    ))}
                    <td className="whitespace-nowrap p-2 text-end font-mono text-ink">
                      {row.total === undefined ? '' : <Cell value={row.total} row={row} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        {months.some((m) => m.revisionPriceMissing) && (
          <p className="mt-3 text-xs text-gold">
            فيه طلاب مراجعات متخططين، بس سعر باقة المراجعات لسه متحددش، فإيرادهم محسوب صفر.
          </p>
        )}
      </Panel>

      <Panel
        title="شهر بشهر"
        note="الخطة: عدد الطلاب وساعات التصوير. الفعلي: اكتبه آخر الشهر، والفاضي معناه لسه متسجلش"
        className="mt-6"
      >
        <div className="grid gap-3">
          {months.map((m) => (
            <details
              key={m.key}
              open={m.key === current.key}
              className="rounded border border-navy-line bg-navy-soft/20 p-4"
            >
              <summary className="cursor-pointer text-sm font-extrabold text-ink">
                {m.label}
                <span className="ms-3 text-xs font-normal text-ink-faint">
                  {PHASE_LABELS[m.phase]} · ربح متوقع {money(m.profit)}
                  {m.actual && ` · فعلي ${money(m.actual.profit)}`}
                </span>
              </summary>
              <div className="mt-4">
                <MonthForm
                  monthKey={m.key}
                  record={data.records[m.key]}
                  revision={m.phase === 'revision'}
                />
              </div>
            </details>
          ))}
        </div>
      </Panel>

      <Panel title="الافتراضات" note="الأسعار والتكاليف اللي الحساب كله مبني عليها" className="mt-6">
        <SettingsForm
          settings={data.settings}
          months={months.map((m) => ({ key: m.key, label: m.label }))}
        />
      </Panel>
    </Shell>
  )
}
