'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { getUnitExamStore } from '@/lib/unit-exam-store'

/**
 * Extra time for a student whose connection or device failed. Admin only, and
 * the permission check comes first (see app/dashboard/actions.ts). The new end
 * is written on the attempt itself, so the student's next save or resume picks
 * it up; who gave it and why is recorded in unit_exam_extensions.
 */
const Input = z.object({
  attemptId: z.string().uuid(),
  minutes: z.coerce.number().int().min(1).max(120),
  reason: z.string().trim().min(2).max(200),
})

export async function extendAction(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireAdmin()
  const parsed = Input.safeParse({
    attemptId: formData.get('attemptId'),
    minutes: formData.get('minutes'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) return { error: 'اكتب عدد الدقايق (1 لـ 120) والسبب' }

  const store = getUnitExamStore()
  const attempt = await store.getAttempt(parsed.data.attemptId)
  if (!attempt) return { error: 'المحاولة مش موجودة' }
  if (attempt.submitted_at) return { error: 'الطالب سلّم خلاص' }

  // From whichever is later: the old end, or now (a student already locked out).
  const base = Math.max(Date.parse(attempt.ends_at), Date.now())
  await store.updateAttempt(attempt.id, {
    ends_at: new Date(base + parsed.data.minutes * 60_000).toISOString(),
    extended_minutes: attempt.extended_minutes + parsed.data.minutes,
  })
  await store.addExtension(attempt.id, parsed.data.minutes, parsed.data.reason, user.email)
  await store.addEvent(attempt.id, 'extended', null, { minutes: parsed.data.minutes, by: user.email })

  revalidatePath('/dashboard/unit-exam')
  return { ok: true }
}
