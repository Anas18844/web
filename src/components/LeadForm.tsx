'use client'

import { useRef, useState } from 'react'
import {
  ATTENDANCE,
  BRANCHES,
  GRADES,
  HEARD_FROM,
  INTENTS,
  site,
  type Intent,
} from '@/content/site'
import { common } from '@/content/copy'
import { collectUtm } from '@/lib/utm'
import { events } from '@/lib/analytics'
import { EG_MOBILE, normalizePhone } from '@/lib/phone'
import { nameError } from '@/lib/name'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { cn } from '@/lib/utils'

type FieldKey = 'name' | 'phone' | 'whatsapp' | 'grade' | 'attendance' | 'branch' | 'heardFrom'
type Errors = Partial<Record<FieldKey | 'form', string>>

export function LeadForm({
  intent,
  pageContext,
  className,
}: {
  intent: Intent
  pageContext: string
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [errors, setErrors] = useState<Errors>({})

  // Controlled only where behaviour depends on the value:
  // the WhatsApp mirror button and the conditional branch question.
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(false)
  const [attendance, setAttendance] = useState<string>('')

  const mountedAt = useRef(Date.now())

  function applySameAsPhone(checked: boolean) {
    setSameAsPhone(checked)
    if (checked) {
      setWhatsapp(phone)
      setErrors((prev) => ({ ...prev, whatsapp: undefined }))
    }
  }

  function onPhoneChange(value: string) {
    setPhone(value)
    if (sameAsPhone) setWhatsapp(value)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return

    const data = new FormData(e.currentTarget)

    const name = String(data.get('name') || '')
    const grade = String(data.get('grade') || '')
    const branch = String(data.get('branch') || '')
    const heardFrom = String(data.get('heardFrom') || '')
    const normalizedPhone = normalizePhone(phone)
    const normalizedWhatsapp = normalizePhone(sameAsPhone ? phone : whatsapp)

    // Client-side checks mirror the server's, purely for instant feedback.
    const next: Errors = {}

    switch (nameError(name)) {
      case 'empty':
        next.name = common.form.errorNameEmpty
        break
      case 'not_arabic':
        next.name = common.form.errorNameArabic
        break
      case 'not_triple':
        next.name = common.form.errorNameTriple
        break
    }

    if (!EG_MOBILE.test(normalizedPhone)) next.phone = common.form.errorPhone
    if (!EG_MOBILE.test(normalizedWhatsapp)) next.whatsapp = common.form.errorWhatsapp
    if (!grade) next.grade = common.form.errorGrade
    if (!attendance) next.attendance = common.form.errorAttendance
    if (attendance === 'center' && !branch) next.branch = common.form.errorBranch
    if (!heardFrom) next.heardFrom = common.form.errorHeardFrom

    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    setErrors({})
    setState('sending')

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: normalizedPhone,
          whatsapp: normalizedWhatsapp,
          grade,
          attendance,
          branch: attendance === 'center' ? branch : undefined,
          heardFrom,
          intent,
          note: String(data.get('note') || '').trim(),
          pageContext,
          utm: collectUtm(),
          company: String(data.get('company') || ''), // honeypot
          elapsed: Date.now() - mountedAt.current,
        }),
      })

      if (!res.ok) throw new Error('request failed')

      events.leadSubmitted(intent, grade)
      setState('done')
    } catch {
      // The visitor's input is preserved — we never clear the form on failure.
      setErrors({ form: common.form.errorGeneric })
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div
        className={cn(
          'animate-fade-up rounded border border-gold/40 bg-navy-soft/60 p-6 sm:p-8',
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <p className="text-xl font-extrabold text-gold">{common.form.successTitle}</p>
        <p className="mt-3 text-body text-ink-muted">
          {common.form.successBody} {site.responsePromise}.
        </p>
        <WhatsAppButton context={pageContext} variant="secondary" className="mt-6">
          {common.form.whatsappCta}
        </WhatsAppButton>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        'rounded border border-navy-line bg-navy-soft/40 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] sm:p-8',
        className,
      )}
    >
      <p className="mb-6 flex items-center gap-3 text-sm font-semibold text-gold">
        <span aria-hidden="true" className="h-0.5 w-6 shrink-0 bg-gold" />
        {INTENTS[intent]}
      </p>

      <div className="grid gap-5">
        <Field id="name" label={common.form.name} hint={common.form.nameHint} error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={common.form.namePlaceholder}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('name', errors.name, common.form.nameHint)}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>

        <Field id="phone" label={common.form.phone} error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={common.form.phonePlaceholder}
            required
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy('phone', errors.phone)}
            className={cn(inputClass(Boolean(errors.phone)), 'text-start')}
          />
        </Field>

        <Field
          id="whatsapp"
          label={common.form.whatsapp}
          hint={common.form.whatsappHint}
          error={errors.whatsapp}
          action={
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-gold">
              <input
                type="checkbox"
                checked={sameAsPhone}
                onChange={(e) => applySameAsPhone(e.target.checked)}
                className="h-4 w-4 accent-[#CBA352]"
              />
              {common.form.sameAsPhone}
            </label>
          }
        >
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            readOnly={sameAsPhone}
            placeholder={common.form.phonePlaceholder}
            required
            aria-invalid={Boolean(errors.whatsapp)}
            aria-describedby={describedBy('whatsapp', errors.whatsapp, common.form.whatsappHint)}
            className={cn(
              inputClass(Boolean(errors.whatsapp)),
              'text-start',
              sameAsPhone && 'opacity-60',
            )}
          />
        </Field>

        <Field id="grade" label={common.form.grade} error={errors.grade}>
          <select
            id="grade"
            name="grade"
            required
            defaultValue=""
            aria-invalid={Boolean(errors.grade)}
            aria-describedby={describedBy('grade', errors.grade)}
            className={inputClass(Boolean(errors.grade))}
          >
            <option value="" disabled>
              {common.form.gradePlaceholder}
            </option>
            {GRADES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Two options — segmented buttons beat a dropdown on mobile. */}
        <fieldset>
          <legend className="mb-2 block text-sm font-bold text-ink">
            {common.form.attendance}
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {ATTENDANCE.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex min-h-[3rem] cursor-pointer items-center justify-center rounded border px-4 text-base font-bold',
                  'transition-[background-color,border-color,color,box-shadow] duration-200',
                  attendance === option.value
                    ? 'border-gold bg-gold text-navy shadow-[0_0_20px_-8px_rgba(203,163,82,0.9)]'
                    : 'border-navy-line bg-navy text-ink hover:border-gold/60 hover:bg-gold/[0.06]',
                )}
              >
                <input
                  type="radio"
                  name="attendance"
                  value={option.value}
                  checked={attendance === option.value}
                  onChange={(e) => setAttendance(e.target.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          {errors.attendance && <ErrorText id="attendance">{errors.attendance}</ErrorText>}
        </fieldset>

        {/* Revealed only for centre students — online students never see it. */}
        {attendance === 'center' && (
          <Field id="branch" label={common.form.branch} error={errors.branch}>
            <select
              id="branch"
              name="branch"
              required
              defaultValue=""
              aria-invalid={Boolean(errors.branch)}
              aria-describedby={describedBy('branch', errors.branch)}
              className={inputClass(Boolean(errors.branch))}
            >
              <option value="" disabled>
                {common.form.branchPlaceholder}
              </option>
              {BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field id="heardFrom" label={common.form.heardFrom} error={errors.heardFrom}>
          <select
            id="heardFrom"
            name="heardFrom"
            required
            defaultValue=""
            aria-invalid={Boolean(errors.heardFrom)}
            aria-describedby={describedBy('heardFrom', errors.heardFrom)}
            className={inputClass(Boolean(errors.heardFrom))}
          >
            <option value="" disabled>
              {common.form.heardFromPlaceholder}
            </option>
            {HEARD_FROM.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="note" label={common.form.note}>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={500}
            placeholder={common.form.notePlaceholder}
            className={inputClass(false)}
          />
        </Field>

        {/* Honeypot — hidden from humans and assistive tech, irresistible to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {errors.form && (
        <p
          role="alert"
          className="mt-5 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200"
        >
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className={cn(
          'mt-7 inline-flex min-h-[3rem] w-full items-center justify-center gap-2.5 rounded bg-gold px-6 py-3 text-base font-extrabold text-navy',
          'transition-[background-color,color,box-shadow,transform] duration-200',
          'hover:bg-gold-deep hover:text-ink hover:shadow-[0_0_28px_-8px_rgba(203,163,82,0.9)]',
          'active:translate-y-px motion-reduce:active:translate-y-0',
          'disabled:cursor-wait disabled:opacity-70 disabled:hover:shadow-none',
        )}
      >
        {/* A spinner instead of a frozen button: the only thing a visitor can
            do while this is in flight is wonder whether it worked. */}
        {state === 'sending' && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          />
        )}
        {state === 'sending' ? common.form.submitting : common.form.submit}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
        بياناتك بتُستخدم للتواصل معاك بس — مش بتتنشر ولا بتتشارك مع حد.
      </p>
    </form>
  )
}

/**
 * One definition for every control in the form. Focus warms the border to gold
 * AND lays a soft gold halo behind it, so the active field is unmistakable on
 * a dark surface where a 1px border change alone is easy to miss.
 */
function inputClass(hasError: boolean) {
  return cn(
    'w-full min-h-[3rem] rounded border bg-navy px-4 py-3 text-base text-ink placeholder:text-ink-faint/70',
    'transition-[border-color,box-shadow] duration-200',
    'focus:border-gold focus:shadow-[0_0_0_3px_rgba(203,163,82,0.14)]',
    hasError
      ? 'border-red-400/70 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]'
      : 'border-navy-line hover:border-gold/30',
  )
}

function describedBy(id: string, error?: string, hint?: string) {
  const ids = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={`${id}-error`} role="alert" className="mt-2 text-xs font-semibold text-red-300">
      {children}
    </p>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  action,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-bold text-ink">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-xs text-ink-faint">
          {hint}
        </p>
      )}
      {error && <ErrorText id={id}>{error}</ErrorText>}
    </div>
  )
}
