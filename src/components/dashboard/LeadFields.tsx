'use client'

import { ATTENDANCE, BRANCHES, GRADES, HEARD_FROM } from '@/content/site'
import { STATUSES } from '@/lib/dashboard-labels'

/**
 * The lead form fields, shared by "add" and "edit".
 *
 * One definition, so a field added for manual entry cannot go missing from the
 * edit dialog — the way two hand-maintained copies of a form always eventually
 * differ, usually in the field that matters.
 */

export const field =
  'w-full min-h-[2.75rem] rounded border border-navy-line bg-navy px-3 py-2 text-sm text-ink ' +
  'placeholder:text-ink-faint/70 transition-colors duration-200 focus:border-gold focus:outline-none'

export function Row({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[0.7rem] text-ink-faint">{hint}</p>}
    </div>
  )
}

export function LeadFields({
  defaults,
  attendance,
  onAttendanceChange,
  showStatus = false,
}: {
  defaults?: Partial<Record<string, string | null>>
  attendance: string
  onAttendanceChange: (value: string) => void
  showStatus?: boolean
}) {
  const v = (key: string) => defaults?.[key] ?? ''

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Row id="name" label="اسم الطالب" hint="ثلاثي لو أمكن">
          <input id="name" name="name" required defaultValue={v('name')} className={field} />
        </Row>
      </div>

      <Row id="phone" label="رقم التليفون">
        <input
          id="phone"
          name="phone"
          type="tel"
          dir="ltr"
          inputMode="tel"
          required
          placeholder="01xxxxxxxxx"
          defaultValue={v('phone')}
          className={`${field} text-start`}
        />
      </Row>

      <Row id="whatsapp" label="رقم الواتساب" hint="سيبها فاضية لو نفس الرقم">
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          dir="ltr"
          inputMode="tel"
          placeholder="01xxxxxxxxx"
          defaultValue={v('whatsapp')}
          className={`${field} text-start`}
        />
      </Row>

      <Row id="grade" label="الصف">
        <select id="grade" name="grade" required defaultValue={v('grade')} className={field}>
          <option value="">اختار…</option>
          {GRADES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </Row>

      <Row id="attendance" label="بيدرس إزاي">
        <select
          id="attendance"
          name="attendance"
          value={attendance}
          onChange={(e) => onAttendanceChange(e.target.value)}
          className={field}
        >
          <option value="">مش محدّد</option>
          {ATTENDANCE.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </Row>

      {/* Only for centre students — the database refuses a branch without one,
          so offering it here would only produce an error later. */}
      {attendance === 'center' && (
        <Row id="branch" label="الفرع">
          <select id="branch" name="branch" defaultValue={v('branch')} className={field}>
            <option value="">اختار…</option>
            {BRANCHES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Row>
      )}

      <Row id="heard_from" label="جه منين">
        <select
          id="heard_from"
          name="heard_from"
          defaultValue={v('heard_from')}
          className={field}
        >
          <option value="">مش محدّد</option>
          {HEARD_FROM.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
      </Row>

      {showStatus && (
        <Row id="status" label="حالة المتابعة">
          <select id="status" name="status" defaultValue={v('status') || 'new'} className={field}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Row>
      )}

      <div className="sm:col-span-2">
        <Row id="note" label="ملاحظات" hint="أي حاجة مهمة عن الطالب أو المكالمة">
          <textarea
            id="note"
            name="note"
            rows={3}
            defaultValue={v('note')}
            className={`${field} resize-y`}
          />
        </Row>
      </div>
    </div>
  )
}
