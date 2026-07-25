'use client'

import { useRef, useState } from 'react'
import { GRADES, INTENTS, site, type Intent } from '@/content/site'
import { common } from '@/content/copy'
import { collectUtm } from '@/lib/utm'
import { events } from '@/lib/analytics'
import { EG_MOBILE, normalizePhone } from '@/lib/phone'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { cn } from '@/lib/utils'

type Errors = Partial<Record<'name' | 'whatsapp' | 'grade' | 'form', string>>

/**
 * The capture form (Doc 05).
 *
 * Three required fields only — name, WhatsApp, grade — plus an optional
 * referral field. Every extra field is a tax on the submission rate, and the
 * rest of the data is earned in conversation, not extracted up front.
 */
export function LeadForm({
  intent,
  pageContext,
  withNote = false,
  className,
}: {
  intent: Intent
  pageContext: string
  /** Parents page only: lets them ask for a call in their own words. */
  withNote?: boolean
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [errors, setErrors] = useState<Errors>({})
  const mountedAt = useRef(Date.now())
  const formRef = useRef<HTMLFormElement>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return

    const form = e.currentTarget
    const data = new FormData(form)

    const name = String(data.get('name') || '').trim()
    const whatsappRaw = String(data.get('whatsapp') || '')
    const whatsapp = normalizePhone(whatsappRaw)
    const grade = String(data.get('grade') || '')

    // Client-side checks mirror the server's, purely to give instant feedback.
    const next: Errors = {}
    if (name.length < 2) next.name = common.form.errorName
    if (!EG_MOBILE.test(whatsapp)) next.whatsapp = common.form.errorWhatsapp
    if (!grade) next.grade = common.form.errorGrade

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
          whatsapp,
          grade,
          intent,
          referredBy: String(data.get('referredBy') || '').trim(),
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
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className={cn('rounded border border-navy-line bg-navy-soft/40 p-6 sm:p-8', className)}
    >
      <p className="mb-6 text-sm font-semibold text-gold">{INTENTS[intent]}</p>

      <div className="grid gap-5">
        <Field
          id="name"
          label={common.form.name}
          error={errors.name}
          input={
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="given-name"
              placeholder={common.form.namePlaceholder}
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={inputClass(Boolean(errors.name))}
            />
          }
        />

        <Field
          id="whatsapp"
          label={common.form.whatsapp}
          hint={common.form.whatsappHint}
          error={errors.whatsapp}
          input={
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder={common.form.whatsappPlaceholder}
              required
              aria-invalid={Boolean(errors.whatsapp)}
              aria-describedby={
                errors.whatsapp ? 'whatsapp-error whatsapp-hint' : 'whatsapp-hint'
              }
              className={cn(inputClass(Boolean(errors.whatsapp)), 'text-start')}
            />
          }
        />

        <Field
          id="grade"
          label={common.form.grade}
          error={errors.grade}
          input={
            <select
              id="grade"
              name="grade"
              required
              defaultValue=""
              aria-invalid={Boolean(errors.grade)}
              aria-describedby={errors.grade ? 'grade-error' : undefined}
              className={inputClass(Boolean(errors.grade))}
            >
              <option value="" disabled>
                اختار…
              </option>
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          }
        />

        {withNote && (
          <Field
            id="note"
            label="حابب تضيف حاجة؟ (اختياري)"
            input={
              <textarea
                id="note"
                name="note"
                rows={3}
                maxLength={300}
                placeholder="مثلاً: أفضّل مكالمة، أو سؤال معيّن"
                className={inputClass(false)}
              />
            }
          />
        )}

        <Field
          id="referredBy"
          label={common.form.referral}
          input={
            <input
              id="referredBy"
              name="referredBy"
              type="text"
              placeholder={common.form.referralPlaceholder}
              className={inputClass(false)}
            />
          }
        />

        {/* Honeypot — hidden from humans and assistive tech, irresistible to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="mt-5 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="mt-7 inline-flex min-h-[3rem] w-full items-center justify-center rounded bg-gold px-6 py-3 text-base font-extrabold text-navy transition-colors hover:bg-gold-deep hover:text-ink disabled:opacity-70"
      >
        {state === 'sending' ? common.form.submitting : common.form.submit}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
        بياناتك بتُستخدم للتواصل معاك بس — مش بتتنشر ولا بتتشارك مع حد.
      </p>
    </form>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full min-h-[3rem] rounded border bg-navy px-4 py-3 text-base text-ink placeholder:text-ink-faint/70',
    'transition-colors focus:border-gold',
    hasError ? 'border-red-400/70' : 'border-navy-line',
  )
}

function Field({
  id,
  label,
  hint,
  error,
  input,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  input: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
        {label}
      </label>
      {input}
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-xs text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs font-semibold text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
