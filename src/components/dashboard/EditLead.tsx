'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  deleteLeadAction,
  updateLeadAction,
  type ActionState,
} from '@/app/dashboard/actions'
import type { Lead } from '@/lib/leads-repo'
import { Dialog } from './Dialog'
import { LeadFields, field } from './LeadFields'

/**
 * Editing and deleting — admin only.
 *
 * This component is only rendered for an admin, and that is the LEAST important
 * of the guards. `updateLeadAction` and `deleteLeadAction` each call
 * requireAdmin() as their first statement, because a server action is a public
 * endpoint: whether its button was rendered says nothing about who can invoke
 * it.
 */
function Save() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[2.75rem] rounded bg-gold px-6 text-sm font-extrabold text-navy transition-[background-color,opacity] duration-200 hover:bg-gold-deep hover:text-ink disabled:opacity-60"
    >
      {pending ? 'بنحفظ…' : 'احفظ التعديل'}
    </button>
  )
}

function Destroy() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[2.75rem] rounded border border-red-500/50 bg-red-500/10 px-5 text-sm font-extrabold text-red-200 transition-colors duration-200 hover:bg-red-500/20 disabled:opacity-60"
    >
      {pending ? 'بنمسح…' : 'امسح نهائي'}
    </button>
  )
}

export function EditLead({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [attendance, setAttendance] = useState(lead.attendance ?? '')
  const [confirming, setConfirming] = useState(false)

  const [saveState, save] = useActionState<ActionState, FormData>(updateLeadAction, {})
  const [deleteState, destroy] = useActionState<ActionState, FormData>(deleteLeadAction, {})

  useEffect(() => {
    if (saveState.ok || deleteState.ok) onClose()
  }, [saveState.ok, deleteState.ok, onClose])

  return (
    <Dialog
      title="تعديل بيانات الطالب"
      description={lead.name}
      onClose={onClose}
    >
      <form action={save} className="grid gap-5">
        <input type="hidden" name="id" value={lead.id} />

        <LeadFields
          defaults={lead as unknown as Record<string, string | null>}
          attendance={attendance}
          onAttendanceChange={setAttendance}
          showStatus
        />

        {saveState.error && (
          <p
            role="alert"
            className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
          >
            {saveState.error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[2.75rem] rounded border border-navy-line px-4 text-sm font-bold text-ink-muted transition-colors duration-200 hover:border-gold/50 hover:text-gold"
          >
            إلغاء
          </button>
          <Save />
        </div>
      </form>

      {/* ── Deletion, deliberately separated ──────────────────────────────
          Its own form, below a rule, behind a disclosure, requiring a typed
          word. Deleting a lead destroys the only record of a student who
          asked for help — and this dashboard is explicitly meant to drive
          decisions that are hard to walk back. The friction is the feature.
          The row is copied into the audit table before it goes. */}
      <div className="mt-7 border-t border-navy-line pt-5">
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs font-bold text-red-300/80 transition-colors duration-200 hover:text-red-200"
          >
            امسح الطالب ده نهائي
          </button>
        ) : (
          <form action={destroy} className="grid gap-3">
            <input type="hidden" name="id" value={lead.id} />

            <p className="text-xs leading-relaxed text-ink-muted">
              ده هيمسح <span className="font-bold text-ink">{lead.name}</span> من الداتابيز
              نهائي. الحركة دي بتتسجّل باسمك في سجل المراجعة، ومش هينفع ترجع فيها.
              اكتب <span className="font-bold text-red-200">احذف</span> عشان تأكّد.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <input
                name="confirm"
                required
                autoComplete="off"
                placeholder="احذف"
                aria-label="اكتب احذف للتأكيد"
                className={`${field} max-w-[10rem]`}
              />
              <Destroy />
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-xs font-bold text-ink-faint hover:text-ink"
              >
                إلغاء
              </button>
            </div>

            {deleteState.error && (
              <p
                role="alert"
                className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
              >
                {deleteState.error}
              </p>
            )}
          </form>
        )}
      </div>
    </Dialog>
  )
}
