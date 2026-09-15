'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { audit, requireUser } from '@/lib/auth'
import { clearAttendance, recordExamMark, setAttendance } from '@/lib/register-repo'
import { cairoToday, planFor, weekDate, weekOf } from '@/lib/weeks'

/**
 * The register's writes.
 *
 * Every one begins with `requireUser()` before it looks at its input: a server
 * action is a public endpoint, and whether a button was rendered says nothing
 * about who can call it.
 *
 * Both take a WEEK, never a date or an exam slug, and derive the rest here. The
 * browser used to send the date and the slug itself — which meant the week an
 * attendance landed in, and the paper a mark was filed against, were whatever
 * the client said they were.
 */

export type RegisterState = { ok?: boolean; error?: string; message?: string }

/** A week that exists: from the first to the one being taught now. */
const week = z
  .number()
  .int()
  .min(1)
  .refine((w) => w <= weekOf(cairoToday()), 'الأسبوع ده لسه ماجاش')

const attendanceSchema = z.object({
  leadId: z.string().uuid(),
  week,
  status: z.enum(['present', 'absent', 'late', 'excused', 'clear']),
  note: z.string().trim().max(300).optional(),
})

export async function markAttendanceAction(input: {
  leadId: string
  week: number
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

  const { leadId, status, note } = parsed.data
  const date = weekDate(parsed.data.week)

  try {
    if (status === 'clear') {
      await clearAttendance(leadId, date)
    } else {
      await setAttendance(actor, leadId, date, status, note)
    }

    /**
     * Deliberately NOT written to the audit log: a register is dozens of taps
     * per lesson, and burying a deleted phone number under three hundred ticks
     * would make the log useless for what it is for. `recorded_by` on the row
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
  grade: z.enum(['first_sec', 'second_bacc']),
  week,
  score: z.number().int().min(0).max(1000),
})

export async function recordExamMarkAction(input: {
  leadId: string
  grade: string
  week: number
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

  const { exam } = planFor(parsed.data.grade, parsed.data.week)
  if (!exam) return { error: 'مفيش امتحان في الأسبوع ده' }

  if (parsed.data.score > exam.marks) {
    return { error: `الدرجة لازم تكون من ${exam.marks} أو أقل` }
  }

  try {
    await recordExamMark(actor, parsed.data.leadId, exam.slug, parsed.data.score, exam.marks, exam.passMark)

    // This one IS audited: a mark is a claim about a student that somebody
    // will act on, and unlike a tick it is entered once and rarely revisited.
    await audit(actor, 'update', {
      leadId: parsed.data.leadId,
      after: { exam: exam.slug, week: parsed.data.week, score: parsed.data.score, of: exam.marks, source: 'manual' },
    })

    revalidatePath('/dashboard/register')
    return { ok: true, message: 'الدرجة اتسجّلت' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
