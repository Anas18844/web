'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extendAction } from '@/app/dashboard/unit-exam/actions'

/** Re-renders the monitor from the server every `seconds`. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), seconds * 1000)
    return () => window.clearInterval(id)
  }, [router, seconds])
  return null
}

/** The «تمديد» button on one student's row. */
export function ExtendButton({ attemptId, name }: { attemptId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(extendAction, {})

  useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state])

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="rounded border border-gold/50 px-2.5 py-1 text-xs font-bold text-gold hover:bg-gold/10">
        تمديد
      </button>
    )
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input name="minutes" type="number" min={1} max={120} defaultValue={10} aria-label={`دقايق التمديد لـ ${name}`}
        className="w-16 rounded border border-navy-line bg-navy-deep px-2 py-1 text-xs text-ink" />
      <input name="reason" placeholder="السبب" aria-label="سبب التمديد"
        className="w-28 rounded border border-navy-line bg-navy-deep px-2 py-1 text-xs text-ink" />
      <button type="submit" disabled={pending} className="rounded bg-gold px-2.5 py-1 text-xs font-extrabold text-navy-deep">
        {pending ? '…' : 'مدّد'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-faint">إلغاء</button>
      {state.error && <span className="w-full text-xs text-red-300">{state.error}</span>}
    </form>
  )
}
