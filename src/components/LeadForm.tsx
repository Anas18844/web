'use client'

import { useEffect, useRef, useState } from 'react'
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
import { enqueue, flush, startOutbox } from '@/lib/outbox'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { WhatsAppChannel } from '@/components/WhatsAppChannel'
import { cn } from '@/lib/utils'

type FieldKey = 'name' | 'phone' | 'whatsapp' | 'grade' | 'attendance' | 'branch' | 'heardFrom'
type Errors = Partial<Record<FieldKey | 'form', string>>

/**
 * Two-step capture.
 *
 * Step one asks for the three things a follow-up call actually needs — name,
 * phone, year — and SAVES THEM. Step two enriches the row that already exists.
 *
 * That ordering is the entire design. A student who fills three fields and
 * then walks away used to leave nothing behind; now they leave a lead the team
 * can ring. Every field after step one is a bonus on top of a capture we have
 * already banked, which is also why step two never blocks the student: if it
 * fails, their data is still safe and we say so rather than showing an error.
 *
 * There is deliberately no way back to step one. The row is written the moment
 * step one succeeds, and a "back" button that let the phone number change
 * would either orphan that row or silently create a second one.
 */
export function LeadForm({
  intent,
  pageContext,
  className,
}: {
  intent: Intent
  pageContext: string
  className?: string
}) {
  const [step, setStep] = useState<1 | 2 | 'done'>(1)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  /** The id of the row step one saved. Null if step one could not reach it. */
  const leadId = useRef<string | null>(null)
  /**
   * Everything step one collected, kept so step two can (a) identify the row
   * by phone and (b) re-send the whole lead if attaching to that row fails.
   */
  const captured = useRef<{ name: string; grade: string; phone: string }>({
    name: '',
    grade: '',
    phone: '',
  })

  // Controlled only where behaviour depends on the value:
  // the WhatsApp mirror button and the conditional branch question.
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(true)
  const [attendance, setAttendance] = useState<string>('')

  const mountedAt = useRef(Date.now())

  /**
   * Identifies THIS student's submission across retries, so a queued lead
   * re-sent tomorrow is recognisable as the same one rather than a new person.
   */
  const submissionKey = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  /**
   * Anything left in the outbox from a previous visit goes out now — before
   * this student even touches the form. A lead queued during an outage is
   * delivered by the next person to open the page on that device, which in
   * practice is the same student coming back.
   */
  useEffect(() => {
    startOutbox()
  }, [])

  /**
   * The form reports itself as seen, once.
   *
   * Without this there is no denominator: `lead_started` on its own says how
   * many students filled the form in, and nothing at all about how many looked
   * at it and walked away — which is the number that says whether the problem
   * is the traffic or the form.
   *
   * `once` is a ref rather than state because re-rendering on it would be a
   * re-render of the whole form to change nothing visible, and because the
   * observer disconnects itself the moment it fires anyway.
   */
  const formRef = useRef<HTMLFormElement>(null)
  const reportedView = useRef(false)

  useEffect(() => {
    const node = formRef.current
    if (!node || reportedView.current || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || reportedView.current) return
        reportedView.current = true
        events.formViewed(pageContext)
        observer.disconnect()
      },
      // A third of it on screen — scrolling past the top edge on the way to the
      // footer is not "seeing the form".
      { threshold: 0.33 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [pageContext])

  function applySameAsPhone(checked: boolean) {
    setSameAsPhone(checked)
    if (checked) {
      setWhatsapp(captured.current.phone)
      setErrors((prev) => ({ ...prev, whatsapp: undefined }))
    }
  }

  /**
   * One request, one retry. The retry covers transient network blips and 5xx;
   * a 4xx is deterministic — the same payload will fail the same way — so it
   * comes back immediately and the caller falls through to its next route.
   */
  async function sendLead(method: 'POST' | 'PATCH', payload: object): Promise<Response> {
    const attempt = () =>
      fetch('/api/lead', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

    try {
      const res = await attempt()
      if (res.status >= 500) throw new Error(String(res.status))
      return res
    } catch {
      await new Promise((r) => setTimeout(r, 650))
      return attempt()
    }
  }

  /**
   * ── Step one ─────────────────────────────────────────────────────────────
   *
   * Saves early when it can — but NEVER blocks on it. If the early save fails
   * for any reason (a stale server running an older API, a dead connection, a
   * database hiccup), the student is moved forward anyway with `leadId` left
   * null, everything they typed held in refs, and the COMPLETE lead sent at
   * the end through the recovery path instead.
   *
   * This is the radical guarantee: there is no response a server can give to
   * step one that stops the form. The early save is an optimisation for the
   * follow-up team, not a gate the student has to pass.
   */
  async function submitStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return

    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') || '')
    const grade = String(data.get('grade') || '')
    const normalizedPhone = normalizePhone(phone)

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
    if (!grade) next.grade = common.form.errorGrade

    if (Object.keys(next).length) {
      setErrors(next)
      // Which of our own fields failed — never what was typed into them. One
      // field dominating this event means that field is written wrong, not
      // that students keep filling it in wrong.
      events.formRejected(1, Object.keys(next))
      return
    }

    setErrors({})
    setSending(true)

    try {
      const res = await sendLead('POST', {
        name,
        phone: normalizedPhone,
        grade,
        intent,
        pageContext,
        utm: collectUtm(),
        company: String(data.get('company') || ''), // honeypot
        elapsed: Date.now() - mountedAt.current,
      })

      const json = res.ok ? ((await res.json()) as { ok?: boolean; id?: string }) : null
      if (json?.ok) {
        leadId.current = json.id ?? null
        events.leadStarted(intent, grade)
      } else {
        // The early save did not land. Not the student's problem: the full
        // lead goes out at the end of step two instead. Tracked, because a
        // silent fallback with no signal is how a broken server stays broken.
        leadId.current = null
        events.leadStep1Deferred(intent, grade)
      }
    } catch {
      leadId.current = null
      events.leadStep1Deferred(intent, grade)
    } finally {
      captured.current = { name, grade, phone: normalizedPhone }
      // The number carries over by default — most students use one line.
      setWhatsapp(normalizedPhone)
      setStep(2)
      setSending(false)
      // Fired here rather than beside `leadStarted`, because reaching step two
      // is what the student did and saving step one is what the server did.
      // They come apart precisely when something is broken, which is the only
      // time either number is interesting.
      events.leadStep2Reached(intent, grade)
    }
  }

  /**
   * ── Step two ─────────────────────────────────────────────────────────────
   *
   * Three routes to the same place, tried in order, so this step has no way to
   * dead-end:
   *
   *   1. PATCH — attach the answers to the row step one saved.
   *   2. If that cannot find the row (expired, wrong id, whatever), POST the
   *      WHOLE lead. The server completes the open row for that phone, or
   *      writes a finished one. A duplicate row is a far cheaper failure than
   *      a lost student.
   *   3. If even that fails, still show the thanks screen. Step one already
   *      saved their name, phone and year, so the team can call them — and a
   *      red box over data we are holding would only lose us the call.
   *
   * Nothing about the interface changes: the student sees the same button and
   * the same confirmation. The recovery is entirely behind it.
   */
  async function submitStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return

    const data = new FormData(e.currentTarget)
    const branch = String(data.get('branch') || '')
    const heardFrom = String(data.get('heardFrom') || '')
    const note = String(data.get('note') || '').trim()
    const normalizedWhatsapp = normalizePhone(sameAsPhone ? captured.current.phone : whatsapp)

    const next: Errors = {}
    if (!EG_MOBILE.test(normalizedWhatsapp)) next.whatsapp = common.form.errorWhatsapp
    if (!attendance) next.attendance = common.form.errorAttendance
    if (attendance === 'center' && !branch) next.branch = common.form.errorBranch
    if (!heardFrom) next.heardFrom = common.form.errorHeardFrom

    if (Object.keys(next).length) {
      setErrors(next)
      events.formRejected(2, Object.keys(next))
      return
    }

    setErrors({})
    setSending(true)

    const enrichment = {
      whatsapp: normalizedWhatsapp,
      attendance,
      branch: attendance === 'center' ? branch : undefined,
      heardFrom,
      note,
    }

    try {
      // 1 — attach to the existing row, if step one managed to create one.
      if (leadId.current) {
        try {
          const res = await sendLead('PATCH', {
            id: leadId.current,
            phone: captured.current.phone,
            ...enrichment,
          })
          const json = res.ok
            ? ((await res.json()) as { ok?: boolean; matched?: boolean; already?: boolean })
            : null
          // `already` covers a double-submit: the answers are in, and re-sending
          // them would only risk overwriting them with the same thing.
          if (json?.matched || json?.already) {
            finish()
            return
          }
        } catch {
          // Fall through — the full re-send below carries everything anyway.
        }
      }

      // 2 — send the WHOLE lead and let the server sort it out. This payload
      // also happens to satisfy the pre-two-step API schema, so it succeeds
      // even against a server running older code.
      const recovery = await sendLead('POST', {
        ...captured.current,
        ...enrichment,
        intent,
        pageContext,
        utm: collectUtm(),
        elapsed: Date.now() - mountedAt.current,
      })
      const json = recovery.ok ? ((await recovery.json()) as { ok?: boolean }) : null
      if (!json?.ok) throw new Error('recovery failed')

      finish()
    } catch {
      /**
       * 3 — nothing reached the server. The lead is NOT lost: it goes into the
       * outbox, which keeps it on the device and re-sends it on the next page
       * load, when the browser comes back online, or on a backoff timer.
       *
       * This is the last hole closed. Before the outbox, a student who filled
       * everything in during an outage was either shown a red box (and left)
       * or thanked for data nobody kept. Now the answers are held until they
       * can be delivered, and the student is confirmed — because from their
       * side the job really is done.
       */
      enqueue(
        {
          ...captured.current,
          ...enrichment,
          intent,
          pageContext,
          utm: collectUtm(),
          queuedAt: new Date().toISOString(),
        },
        submissionKey.current,
      )
      /**
       * Two events, because two different things went wrong and only one of
       * them is recoverable on its own.
       *
       * `leadRecoveryFailed` says the step-two answers did not reach the row —
       * somebody has to chase that. `leadQueued` says the whole submission is
       * now sitting on this student's device waiting for a network. Firing
       * only the second would make an API outage look like a connectivity
       * blip, which is how a broken server stays broken for a week.
       */
      events.leadRecoveryFailed(intent, captured.current.grade)
      events.leadQueued(intent, captured.current.grade)
      void flush()
      finish()
    } finally {
      setSending(false)
    }

    function finish() {
      events.leadSubmitted(intent, captured.current.grade)
      setStep('done')
    }
  }

  // ── Thanks ─────────────────────────────────────────────────────────────────
  if (step === 'done') {
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
          {common.form.successBody}
        </p>

        {/*
          The channel goes ABOVE the "talk to us" button, and that order is the
          point. A student who has just booked has no question yet — they have
          a wait. Following the channel is the thing to do with that wait, and
          messaging us is the fallback for the minority who do have something
          to ask.
        */}
        <div className="mt-6">
          <WhatsAppChannel context={`${pageContext}_confirmed`} />
        </div>

        <WhatsAppButton context={pageContext} variant="secondary" className="mt-4">
          {common.form.whatsappCta}
        </WhatsAppButton>
      </div>
    )
  }

  const shell = cn(
    'rounded border border-navy-line bg-navy-soft/40 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] sm:p-8',
    className,
  )

  // ── Step two form ──────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <form onSubmit={submitStep2} noValidate className={shell}>
        <StepBar step={2} />

        <div className="mt-5 animate-fade-up">
          <p className="text-lg font-extrabold text-gold">{common.form.step2Title}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{common.form.step2Body}</p>
        </div>

        <div className="mt-7 grid gap-5">
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
              value={sameAsPhone ? captured.current.phone : whatsapp}
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
                {/*
                  A full branch stays visible and is not selectable, with no
                  label explaining why. That is deliberate on both counts: the
                  student learns we are in their area, and is not told the
                  door is shut — the team decides what to say about a waiting
                  list, not a dropdown.
                */}
                {BRANCHES.map((b) => (
                  <option
                    key={b.value}
                    value={b.value}
                    disabled={'closed' in b && b.closed}
                  >
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
        </div>

        {errors.form && <FormError>{errors.form}</FormError>}

        <SubmitButton sending={sending} label={common.form.submit} busy={common.form.submitting} />
      </form>
    )
  }

  // ── Step one form ──────────────────────────────────────────────────────────
  return (
    /**
     * `action` and `method` are the no-JavaScript floor.
     *
     * React's onSubmit calls preventDefault and takes over whenever it is
     * alive. When it is NOT — a chunk that 404s after a deploy, a blocked
     * script, a browser that gave up — the browser falls back to these
     * attributes and posts the form natively to the same endpoint, which saves
     * the lead and redirects to /thanks. Without them the fallback is a GET
     * that puts the student's phone number in the address bar and saves
     * nothing at all.
     */
    <form
      ref={formRef}
      onSubmit={submitStep1}
      action="/api/lead"
      method="post"
      noValidate
      className={shell}
    >
      <StepBar step={1} />

      <p className="mb-6 mt-5 flex items-center gap-3 text-sm font-semibold text-gold">
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
            onChange={(e) => setPhone(e.target.value)}
            placeholder={common.form.phonePlaceholder}
            required
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy('phone', errors.phone)}
            className={cn(inputClass(Boolean(errors.phone)), 'text-start')}
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

        {/* Context the JSON path sends in its payload; the native post has to
            carry it as fields or the server would lose it. */}
        <input type="hidden" name="intent" value={intent} />
        <input type="hidden" name="pageContext" value={pageContext} />

        {/* Honeypot — hidden from humans and assistive tech, irresistible to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {errors.form && <FormError>{errors.form}</FormError>}

      <SubmitButton
        sending={sending}
        label={common.form.step1Submit}
        busy={common.form.step1Submitting}
      />

      <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
        بياناتك بتُستخدم للتواصل معاك بس — مش بتتنشر ولا بتتشارك مع حد.
      </p>
    </form>
  )
}

/**
 * Two segments that fill as the student advances. Shows the cost of finishing
 * up front — "two steps, you are on the first" — which is what stops a second
 * screen from feeling like a form that keeps growing.
 */
function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <div>
      <div className="flex items-center gap-2" aria-hidden="true">
        {[1, 2].map((n) => (
          <span
            key={n}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-500',
              n <= step ? 'bg-gold' : 'bg-navy-line',
            )}
          />
        ))}
      </div>
      {/* Step one carries no label at all (founder request, August 2026): the
          two segments already say "there is a second part", and a sentence
          counting the steps made a three-field form look longer than it is.
          Step two keeps its label, where it reassures instead of warning. */}
      {step === 2 && (
        <p className="mt-3 text-xs font-bold text-ink-faint">{common.form.step2Label}</p>
      )}
    </div>
  )
}

function SubmitButton({
  sending,
  label,
  busy,
}: {
  sending: boolean
  label: string
  busy: string
}) {
  return (
    <button
      type="submit"
      disabled={sending}
      className={cn(
        'mt-7 inline-flex min-h-[3rem] w-full items-center justify-center gap-2.5 rounded bg-gold px-6 py-3 text-base font-extrabold text-navy',
        'shine transition-[background-color,color,box-shadow,transform] duration-200',
        'hover:bg-gold-deep hover:text-ink hover:shadow-[0_0_28px_-8px_rgba(203,163,82,0.9)]',
        'active:translate-y-px motion-reduce:active:translate-y-0',
        'disabled:cursor-wait disabled:opacity-70 disabled:hover:shadow-none',
      )}
    >
      {/* A spinner instead of a frozen button: the only thing a visitor can
          do while this is in flight is wonder whether it worked. */}
      {sending && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      )}
      {sending ? busy : label}
    </button>
  )
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-5 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200"
    >
      {children}
    </p>
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
