'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveMonthAction, saveSettingsAction } from '@/app/dashboard/finance/actions'
import type { ActionState } from '@/app/dashboard/actions'
import type { FinanceSettings, MonthRecord } from '@/lib/finance'

/**
 * The two forms on the finance page. Everything is a plain number box: the
 * page is used to try "what if" quickly, and a box you can tab through beats
 * any cleverer control for that.
 */

const box =
  'w-full min-h-[2.5rem] rounded border border-navy-line bg-navy px-3 py-2 text-sm text-ink ' +
  'transition-[border-color,box-shadow] duration-200 focus:border-gold ' +
  'focus:shadow-[0_0_0_3px_rgba(203,163,82,0.14)] focus:outline-none'

function Field({
  label,
  name,
  value,
  hint,
  step = 'any',
  type = 'number',
}: {
  label: string
  name: string
  value: number | string | null
  hint?: string
  step?: string
  type?: 'number' | 'month' | 'text'
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink-muted">{label}</span>
      <input
        name={name}
        type={type}
        step={type === 'number' ? step : undefined}
        min={type === 'number' ? 0 : undefined}
        defaultValue={value ?? ''}
        dir={type === 'text' ? undefined : 'ltr'}
        className={box}
      />
      {hint && <span className="mt-1 block text-[0.7rem] text-ink-faint">{hint}</span>}
    </label>
  )
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[2.5rem] rounded bg-gold px-5 text-sm font-extrabold text-navy transition-[background-color,opacity] duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
    >
      {pending ? 'بنحفظ…' : label}
    </button>
  )
}

function Result({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-semibold text-red-300">
        {state.error}
      </p>
    )
  if (state.message) return <p className="text-sm font-semibold text-gold">{state.message}</p>
  return null
}

function YesNo({ name, value }: { name: string; value: boolean }) {
  return (
    <select name={name} defaultValue={value ? '1' : '0'} className={box}>
      <option value="1">أيوه</option>
      <option value="0">لأ</option>
    </select>
  )
}

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <fieldset className="rounded border border-navy-line p-4">
    <legend className="px-1 text-xs font-extrabold text-gold">{title}</legend>
    {children}
  </fieldset>
)

export function SettingsForm({
  settings,
  months,
}: {
  settings: FinanceSettings
  months: { key: string; label: string }[]
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveSettingsAction, {})
  // One blank row each, so adding a line never needs a separate button.
  const hours = [...settings.hours, { name: '', hours: 0, studio: true, editing: true }]
  const fixed = [...settings.fixed, { name: '', amount: 0, from: null }]

  return (
    <form action={action} className="grid gap-4">
      <Group title="أسعار الباقات (جنيه)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="الشهر" name="price_month" value={settings.prices.month} />
          <Field label="الترم (٣ شهور)" name="price_term" value={settings.prices.term} />
          <Field label="السنة (٦ شهور)" name="price_year" value={settings.prices.year} />
          <Field
            label="المراجعات (في الشهر)"
            name="price_revision"
            value={settings.prices.revision}
            hint="فاضي = لسه متحددش"
          />
          <Field
            label="نسبة المنصة ٪"
            name="platformShare"
            value={Math.round(settings.platformShare * 1000) / 10}
          />
        </div>
      </Group>

      <Group title="السنتر (جنيه للحصة)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="سعر الحصة" name="center_price" value={settings.center.price} />
          <Field label="الإيجار" name="center_rent" value={settings.center.rent} />
          <Field label="الملزمة والامتحان" name="center_booklet" value={settings.center.booklet} />
          <Field label="الأسيستانت" name="center_assistant" value={settings.center.assistant} />
          <Field
            label="حصص الطالب في الشهر"
            name="center_sessions"
            value={settings.center.sessionsPerMonth}
          />
        </div>
      </Group>

      <Group title="التصوير">
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="ساعة الاستوديو" name="rate_studio" value={settings.rates.studio} />
          <Field label="ساعة المونتاج (على الخام)" name="rate_editing" value={settings.rates.editing} />
        </div>
        <p className="mb-2 text-xs text-ink-faint">
          خطة الساعات في الشهر. امسح اسم البند عشان تشيله، واكتب في السطر الفاضي عشان تضيف.
        </p>
        <div className="grid gap-2">
          {hours.map((h, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_5.5rem_5.5rem] items-end gap-2">
              <Field label={i === 0 ? 'البند' : ''} name="hours_name" value={h.name} type="text" />
              <Field label={i === 0 ? 'ساعات' : ''} name="hours_hours" value={h.hours} />
              <label className="block">
                {i === 0 && <span className="mb-1 block text-xs font-bold text-ink-muted">استوديو؟</span>}
                <YesNo name="hours_studio" value={h.studio} />
              </label>
              <label className="block">
                {i === 0 && <span className="mb-1 block text-xs font-bold text-ink-muted">مونتاج مدفوع؟</span>}
                <YesNo name="hours_editing" value={h.editing} />
              </label>
            </div>
          ))}
        </div>
      </Group>

      <Group title="المصاريف الثابتة في الشهر">
        <p className="mb-2 text-xs text-ink-faint">
          «يبدأ من» فاضي = البند مقفول (زي Claude لحد ما ترجّعه). المصاريف دي مبتتقسمش في الإجازة.
        </p>
        <div className="grid gap-2">
          {fixed.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem_9rem] items-end gap-2">
              <Field label={i === 0 ? 'البند' : ''} name="fixed_name" value={f.name} type="text" />
              <Field label={i === 0 ? 'جنيه' : ''} name="fixed_amount" value={f.amount} />
              <Field label={i === 0 ? 'يبدأ من' : ''} name="fixed_from" value={f.from} type="month" />
            </div>
          ))}
        </div>
      </Group>

      <Group title="الموسم">
        <div className="mb-3 max-w-[12rem]">
          <Field label="أول شهر" name="seasonStart" value={settings.seasonStart} type="month" />
        </div>
        <p className="mb-2 text-xs text-ink-faint">
          الشهر محسوب كام ٪؟ ١٠٠ = شهر كامل. يناير ٥٠ عشان إجازة الـ١٥ يوم، وده بيقسم إيراد الشهر والسنتر
          والتصوير.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-9">
          {months.map((m) => (
            <Field
              key={m.key}
              label={m.label}
              name={`weight_${m.key}`}
              value={Math.round((settings.weights[m.key] ?? 1) * 100)}
            />
          ))}
        </div>
      </Group>

      <div className="flex flex-wrap items-center gap-4">
        <Submit label="احفظ الافتراضات" />
        <Result state={state} />
      </div>
    </form>
  )
}

export function MonthForm({
  monthKey,
  record,
  revision,
}: {
  monthKey: string
  record: MonthRecord
  /** Revision months sell the revision package, not terms or years. */
  revision: boolean
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveMonthAction, {})
  const { plan, actual } = record

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="month" value={monthKey} />

      <Group title="الخطة">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <Field label="طلاب باقة الشهر" name="monthlySubs" value={plan.monthlySubs} step="1" />
          {revision ? (
            <>
              <input type="hidden" name="termSubs" value="0" />
              <input type="hidden" name="yearSubs" value="0" />
              <Field label="طلاب المراجعات" name="revisionSubs" value={plan.revisionSubs} step="1" />
            </>
          ) : (
            <>
              <Field
                label="اشتروا الترم الشهر ده"
                name="termSubs"
                value={plan.termSubs}
                step="1"
                hint="الجداد بس"
              />
              <Field
                label="اشتروا السنة الشهر ده"
                name="yearSubs"
                value={plan.yearSubs}
                step="1"
                hint="الجداد بس"
              />
              <input type="hidden" name="revisionSubs" value={plan.revisionSubs} />
            </>
          )}
          <Field label="طلاب السنتر" name="centerStudents" value={plan.centerStudents} step="1" />
          <Field
            label="ساعات التصوير"
            name="hours"
            value={plan.hours}
            hint="فاضي = حسب الخطة. ٩ في الأسبوع = ٣٦"
          />
        </div>
      </Group>

      <Group title="اللي حصل فعلًا (جنيه)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <Field label="وصل من المنصة" name="actual_platform" value={actual.platform} />
          <Field label="صافي السنتر" name="actual_center" value={actual.center} />
          <Field label="الاستوديو" name="actual_filming" value={actual.filming} />
          <Field label="المونتاج" name="actual_editing" value={actual.editing} />
          <Field label="المرتبات" name="actual_salaries" value={actual.salaries} />
          <Field label="مصاريف تانية" name="actual_other" value={actual.other} />
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-bold text-ink-muted">ملاحظة</span>
          <input name="note" type="text" defaultValue={record.note ?? ''} className={box} />
        </label>
      </Group>

      <div className="flex flex-wrap items-center gap-4">
        <Submit label="احفظ الشهر" />
        <Result state={state} />
      </div>
    </form>
  )
}
