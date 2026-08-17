'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createLeadAction, type ActionState } from '@/app/dashboard/actions'
import { Dialog } from './Dialog'
import { LeadFields } from './LeadFields'

/**
 * Adding a student who arrived some other way — WhatsApp, a phone call, in
 * person at the centre.
 *
 * Available to BOTH roles, which is not a hole in the phone-number rule: a team
 * member typing a number in already knows it. What they still cannot do is read
 * one back out afterwards, including this one.
 *
 * Every lead saved here is stamped `source: 'manual'` server-side. Without that
 * stamp, every conversion rate computed from this table would silently count
 * WhatsApp enquiries as website conversions — and overstate exactly the number
 * the business is trying to judge itself by.
 */
function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[2.75rem] rounded bg-gold px-6 text-sm font-extrabold text-navy transition-[background-color,opacity] duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
    >
      {pending ? 'بنسجّل…' : 'سجّل الطالب'}
    </button>
  )
}

export function AddLead() {
  const [open, setOpen] = useState(false)
  const [attendance, setAttendance] = useState('')
  const [state, action] = useActionState<ActionState, FormData>(createLeadAction, {})

  // Close on success, and reset the conditional branch field with it — leaving
  // "centre" selected would silently apply to the next student typed in.
  useEffect(() => {
    if (state.ok) {
      setOpen(false)
      setAttendance('')
    }
  }, [state.ok])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[2.5rem] rounded bg-gold px-4 text-sm font-extrabold text-navy transition-colors duration-200 hover:bg-gold-deep hover:text-ink"
      >
        + ضيف طالب
      </button>

      {open && (
        <Dialog
          title="ضيف طالب يدوي"
          description="للطلبة اللي جم على الواتساب أو بالتليفون أو في السنتر"
          onClose={() => setOpen(false)}
        >
          <form action={action} className="grid gap-5">
            <LeadFields
              attendance={attendance}
              onAttendanceChange={setAttendance}
              showStatus
            />

            {state.error && (
              <p
                role="alert"
                className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
              >
                {state.error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[2.75rem] rounded border border-navy-line px-4 text-sm font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
              >
                إلغاء
              </button>
              <Submit />
            </div>
          </form>
        </Dialog>
      )}
    </>
  )
}
