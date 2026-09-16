import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase'
import type { SessionUser } from '@/lib/auth'
import type { WeekPlan } from '@/lib/weeks'

/**
 * The register — one screen's worth of data, assembled in one place.
 *
 * The teacher opens this before a lesson and needs four things per student at a
 * glance: who they are, are they here, did they do THIS WEEK'S homework and what
 * did they get, and what did they score on THIS WEEK'S paper. Those live in four
 * tables, so this file does the joining rather than making the page do it.
 *
 * Every question is asked OF A WEEK (see lib/weeks.ts). An earlier version
 * showed "their most recent homework, whatever it was for", and in week 3 that
 * made a student who did week 1's homework and skipped week 2's look exactly
 * like one who did both — on the screen used to decide who is falling behind.
 *
 * Everything is fetched in ONE round trip per table and stitched in memory.
 */

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export type RegisterRow = {
  leadId: string
  name: string
  /** null for a team session — the repo enforces this, not the page. */
  phone: string | null
  grade: string | null
  attendance: string | null
  branch: string | null

  /** This week's mark, if one has been made. */
  status: AttendanceStatus | null
  note: string | null

  /**
   * The homework checked this week, or null if they did not submit it.
   *
   * Best score across attempts, because the homework page lets a student try
   * again and the teacher's question is "did they get there". `attempts` is
   * shown beside it so a 50/50 on the fifth try does not read the same as a
   * 50/50 on the first.
   */
  homework: { score: number; marks: number; passed: boolean; attempts: number; at: string } | null

  /** This week's paper. A mark typed in by hand wins over an online attempt. */
  exam: { score: number; marks: number; passed: boolean; source: string; at: string } | null
}

/**
 * A homework submission whose phone number matches no student.
 *
 * Without this list the register quietly says "ماحلّش" about a student who DID
 * the homework and typed a different number — a sibling's phone, a typo, their
 * own second line. On a screen that decides who is behind, that is the one
 * wrong answer worth designing against.
 */
export type UnmatchedSubmission = {
  name: string | null
  /** Admin only, same as everywhere else. */
  phone: string | null
  score: number
  marks: number
  attempts: number
  at: string
}

export type RegisterFilters = {
  /** Required: a week's homework and paper belong to one grade. */
  grade: string
  attendance?: string
  branch?: string
}

export type Register = {
  rows: RegisterRow[]
  /**
   * Set when the attendance table could not be read, so a missing table does
   * not render as a class where nobody has been ticked yet.
   */
  attendanceError: string | null
  unmatched: UnmatchedSubmission[]
}

type LeadRow = {
  id: string
  name: string
  phone?: string
  grade: string | null
  attendance: string | null
  branch: string | null
}

type HomeworkRow = {
  lead_id: string | null
  student_name: string | null
  phone?: string | null
  total_score: number
  total_marks: number
  passed: boolean
  created_at: string
}

type ExamRow = {
  lead_id: string
  total_score: number
  total_marks: number
  passed: boolean
  source: string | null
  created_at: string
}

export async function getRegister(
  role: 'admin' | 'team',
  plan: WeekPlan,
  filters: RegisterFilters,
): Promise<Register> {
  const supabase = getSupabaseAdmin()

  // Phone follows the same rule as everywhere else: a team session never
  // receives one, and the column is not even requested.
  const leadColumns =
    role === 'admin'
      ? 'id, name, phone, grade, attendance, branch'
      : 'id, name, grade, attendance, branch'

  let query = supabase
    .from('leads')
    .select(leadColumns)
    .eq('grade', filters.grade)
    .order('name', { ascending: true })
  if (filters.attendance) query = query.eq('attendance', filters.attendance)
  if (filters.branch) query = query.eq('branch', filters.branch)

  const { data: leadData, error } = await query
  if (error) throw new Error(error.message)

  const leads = (leadData ?? []) as unknown as LeadRow[]
  const ids = leads.map((l) => l.id)

  const homeworkColumns =
    role === 'admin'
      ? 'lead_id, student_name, phone, total_score, total_marks, passed, created_at'
      : 'lead_id, student_name, total_score, total_marks, passed, created_at'

  const [marks, homework, exams] = await Promise.all([
    (async () => {
      if (ids.length === 0) return { data: [] as { lead_id: string; status: string; note: string | null }[], error: null }
      const r = await supabase
        .from('attendance')
        .select('lead_id, status, note')
        .eq('session_date', plan.date)
        .in('lead_id', ids)
      return { data: (r.data ?? []) as { lead_id: string; status: string; note: string | null }[], error: r.error }
    })(),

    (async () => {
      if (!plan.homework) return [] as HomeworkRow[]
      // Every submission for this week's homework, matched or not — the
      // unmatched ones are the point of asking for all of them.
      const r = await supabase
        .from('homework_submissions')
        .select(homeworkColumns)
        .eq('homework_slug', plan.homework.slug)
        .order('created_at', { ascending: false })
      if (r.error) throw new Error(r.error.message)
      return (r.data ?? []) as unknown as HomeworkRow[]
    })(),

    (async () => {
      if (!plan.exam || ids.length === 0) return [] as ExamRow[]
      const r = await supabase
        .from('exam_submissions')
        .select('lead_id, total_score, total_marks, passed, source, created_at')
        .eq('exam_slug', plan.exam.slug)
        .in('lead_id', ids)
        .order('created_at', { ascending: false })
      if (r.error) throw new Error(r.error.message)
      return (r.data ?? []) as ExamRow[]
    })(),
  ])

  const markByLead = new Map(marks.data.map((m) => [m.lead_id, m]))

  // ── Homework: best score per student, and the ones that match nobody ──────
  const hwByLead = new Map<string, NonNullable<RegisterRow['homework']>>()
  const unmatchedByKey = new Map<string, UnmatchedSubmission>()

  for (const h of homework) {
    if (h.lead_id) {
      const prior = hwByLead.get(h.lead_id)
      if (!prior) {
        hwByLead.set(h.lead_id, {
          score: h.total_score,
          marks: h.total_marks,
          passed: h.passed,
          attempts: 1,
          at: h.created_at,
        })
      } else {
        prior.attempts += 1
        if (h.total_score > prior.score) {
          prior.score = h.total_score
          prior.passed = h.passed
        }
      }
      continue
    }

    // Grouped by phone for an admin and by name for the team, because the
    // team's query never fetched a phone to group by.
    const key = (role === 'admin' ? h.phone : h.student_name) || `anon:${h.created_at}`
    const prior = unmatchedByKey.get(key)
    if (!prior) {
      unmatchedByKey.set(key, {
        name: h.student_name,
        phone: role === 'admin' ? (h.phone ?? null) : null,
        score: h.total_score,
        marks: h.total_marks,
        attempts: 1,
        at: h.created_at,
      })
    } else {
      prior.attempts += 1
      if (h.total_score > prior.score) prior.score = h.total_score
    }
  }

  // ── The paper: a hand-entered mark is the teacher's, so it wins ───────────
  const examByLead = new Map<string, NonNullable<RegisterRow['exam']>>()
  for (const e of exams) {
    const prior = examByLead.get(e.lead_id)
    const candidate = {
      score: e.total_score,
      marks: e.total_marks,
      passed: e.passed,
      source: e.source ?? 'online',
      at: e.created_at,
    }
    if (!prior) {
      examByLead.set(e.lead_id, candidate)
    } else if (prior.source !== 'manual' && (candidate.source === 'manual' || candidate.score > prior.score)) {
      examByLead.set(e.lead_id, candidate)
    }
  }

  const rows: RegisterRow[] = leads.map((lead) => {
    const mark = markByLead.get(lead.id)
    return {
      leadId: lead.id,
      name: lead.name,
      phone: role === 'admin' ? (lead.phone ?? null) : null,
      grade: lead.grade,
      attendance: lead.attendance,
      branch: lead.branch,
      status: (mark?.status as AttendanceStatus | undefined) ?? null,
      note: mark?.note ?? null,
      homework: hwByLead.get(lead.id) ?? null,
      exam: examByLead.get(lead.id) ?? null,
    }
  })

  return {
    rows,
    attendanceError: marks.error?.message ?? null,
    unmatched: [...unmatchedByKey.values()],
  }
}

/**
 * Marks a student present or absent for a week.
 *
 * An upsert on (lead_id, session_date): pressing a different button for the
 * same student in the same week is a CORRECTION, not a second attendance.
 */
export async function setAttendance(
  actor: SessionUser,
  leadId: string,
  date: string,
  status: AttendanceStatus,
  note?: string,
) {
  const { error } = await getSupabaseAdmin().from('attendance').upsert(
    {
      lead_id: leadId,
      session_date: date,
      status,
      note: note?.trim() || null,
      recorded_by: actor.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'lead_id,session_date' },
  )
  if (error) throw new Error(error.message)
}

/** Clears a mark, for the student ticked by mistake. */
export async function clearAttendance(leadId: string, date: string) {
  const { error } = await getSupabaseAdmin()
    .from('attendance')
    .delete()
    .eq('lead_id', leadId)
    .eq('session_date', date)
  if (error) throw new Error(error.message)
}

/**
 * Records a paper exam mark.
 *
 * Written to the same table the site's own marking uses, tagged
 * `source: 'manual'`. Two tables would mean every question about exam results
 * needs a union, and the day someone forgets it the paper marks quietly vanish
 * from a report.
 *
 * The phone comes from the LEAD, not from the caller — a mark must attach to a
 * real student or not be recorded at all.
 */
export async function recordExamMark(
  actor: SessionUser,
  leadId: string,
  examSlug: string,
  score: number,
  marks: number,
  passMark: number,
) {
  const supabase = getSupabaseAdmin()

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, name, phone, grade')
    .eq('id', leadId)
    .maybeSingle()

  if (leadError) throw new Error(leadError.message)
  if (!lead) throw new Error('الطالب مش موجود')

  const { error } = await supabase.from('exam_submissions').upsert(
    {
      exam_slug: examSlug,
      grade: lead.grade,
      student_name: lead.name,
      phone: lead.phone,
      lead_id: lead.id,
      mcq_score: 0,
      mcq_total: 0,
      truefalse_score: 0,
      truefalse_total: 0,
      blanks_score: 0,
      blanks_total: 0,
      essay_score: 0,
      essay_total: 0,
      total_score: score,
      total_marks: marks,
      passed: score >= passMark,
      detail: null,
      grader_source: null,
      source: 'manual',
      recorded_by: actor.id,
      // Deterministic, so re-entering a mark for the same student and exam
      // corrects it rather than adding a second result.
      attempt_key: `manual:${examSlug}:${lead.id}`,
    },
    /**
     * Conflicts on the STUDENT, not on this key.
     *
     * An exam is sat once (migration 009), and the teacher is the authority on
     * the mark. So a paper mark typed in for a student who already sat the
     * paper online CORRECTS the row they have rather than being refused by the
     * unique index — which is what conflicting on `attempt_key` would have
     * meant, since a manual key never matches an online one.
     */
    { onConflict: 'exam_slug,phone' },
  )

  if (error) throw new Error(error.message)
}

/** The week's totals, for the strip above the list. */
export function summarise(rows: RegisterRow[]) {
  return {
    total: rows.length,
    present: rows.filter((r) => r.status === 'present').length,
    late: rows.filter((r) => r.status === 'late').length,
    absent: rows.filter((r) => r.status === 'absent').length,
    excused: rows.filter((r) => r.status === 'excused').length,
    unmarked: rows.filter((r) => !r.status).length,
    didHomework: rows.filter((r) => r.homework).length,
    satExam: rows.filter((r) => r.exam).length,
  }
}
