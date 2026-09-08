'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { audit, requireUser } from '@/lib/auth'
import { clearAttendance, recordExamMark, setAttendance } from '@/lib/register-repo'
import { findExam, totalMarks } from '@/content/exams'

/**
 * The register's writes.
 *
 * Every one begins with `requireUser()` before it looks at its input, for the
 * same reason as the rest of the dashboard: a server action is a public
 * endpoint, and whether a button was rendered says nothing about who can call
 * it.
 *
 * Marking attendance is open to BOTH roles. A team member taking the register
 * while the teacher teaches is the normal case, and it reveals nothing — the
 * screen they do it from already shows them no phone numbers.
 */

export type RegisterState = { ok?: boolean; error?: string; message?: string }

const attendanceSchema = z.object({
  leadId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ مش مظبوط'),
  status: z.enum(['present', 'absent', 'late', 'excused', 'clear']),
  note: z.string().trim().max(300).optional(),
})

export async function markAttendanceAction(input: {
  leadId: string
  date: string
  status: string
  note?: string
}): Promise<RegisterState> {
  let actor
  try {
    actor = await requireUser()
  } catch {
    return { error: 'الجلسة انتهت. سجّل دخول تاني.' }
  }

  const parsed = attendanceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'بيانات مش مظبوطة' }
  }

  const { leadId, date, status, note } = parsed.data

  try {
    if (status === 'clear') {
      await clearAttendance(leadId, date)
    } else {
      await setAttendance(actor, leadId, date, status, note)
    }

    /**
     * Deliberately NOT written to the audit log.
     *
     * A register is dozens of taps per lesson, and every one of them would be a
     * row. The audit table exists so a deletion or an edited phone number can be
     * traced later; burying that under three hundred attendance ticks a week
     * would make it useless for what it is for. `recorded_by` on the row itself
     * already says who marked it.
     */
    revalidatePath('/dashboard/register')
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

const markSchema = z.object({
  leadId: z.string().uuid(),
  examSlug: z.string().min(1).max(80),
  score: z.number().int().min(0).max(1000),
})

export async function recordExamMarkAction(input: {
  leadId: string
  examSlug: string
  score: number
}): Promise<RegisterState> {
  let actor
  try {
    actor = await requireUser()
  } catch {
    return { error: 'الجلسة انتهت. سجّل دخول تاني.' }
  }

  const parsed = markSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات مش مظبوطة' }

  const exam = findExam(parsed.data.examSlug)
  if (!exam) return { error: 'الامتحان ده مش موجود' }

  const marks = totalMarks(exam)
  if (parsed.data.score > marks) {
    return { error: `الدرجة لازم تكون من ${marks} أو أقل` }
  }

  try {
    await recordExamMark(actor, parsed.data.leadId, exam.slug, parsed.data.score, marks, exam.passMark)

    // This one IS audited: a mark is a claim about a student that somebody
    // will act on, and unlike a tick it is entered once and rarely revisited.
    await audit(actor, 'update', {
      leadId: parsed.data.leadId,
      after: { exam: exam.slug, score: parsed.data.score, of: marks, source: 'manual' },
    })

    revalidatePath('/dashboard/register')
    return { ok: true, message: 'الدرجة اتسجّلت' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
