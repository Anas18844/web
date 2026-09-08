import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase'
import type { SessionUser } from '@/lib/auth'

/**
 * The register — one screen's worth of data, assembled in one place.
 *
 * The teacher opens this before a lesson and needs four things per student at a
 * glance: who they are, are they here, did they do the homework and what did
 * they get, and what did they score on the exam. Those live in four tables, so
 * this file does the joining rather than making the page do it.
 *
 * Everything is fetched in ONE round trip per table and stitched in memory.
 * Twenty students is not a scale problem, and a query per student would make
 * the page slower than the paper register it replaces.
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

  /** Today's mark, if one has been made. */
  status: AttendanceStatus | null
  note: string | null

  /** Their most recent homework, whatever it was for. */
  homework: {
    slug: string
    score: number
    marks: number
    passed: boolean
    at: string
  } | null

  /** Their most recent exam mark, entered by hand or earned online. */
  exam: {
    slug: string
    score: number
    marks: number
    passed: boolean
    source: string
    at: string
  } | null
}

export type RegisterFilters = {
  grade?: string
  attendance?: string
  branch?: string
}

/**
 * Builds the register for a date.
 *
 * The student list comes from `leads` — everyone who ever booked — rather than
 * from who happens to have an attendance row, because the whole point of the
 * screen is to mark the ones who are NOT there yet.
 */
export type Register = {
  rows: RegisterRow[]
  /**
   * Set when the attendance table could not be read.
   *
   * Without it the page renders every student as "not yet marked" — which is
   * indistinguishable from a class where nobody has been ticked, and a teacher
   * would only discover the truth when the first tap failed. The same costume a
   * missing table wore on the login screen earlier in this project, and the
   * same fix: say so.
   */
  attendanceError: string | null
}

export async function getRegister(
  role: 'admin' | 'team',
  date: string,
  filters: RegisterFilters = {},
): Promise<Register> {
  const supabase = getSupabaseAdmin()

  // Phone follows the same rule as everywhere else: a team session never
  // receives one, and the column is not even requested.
  const columns =
    role === 'admin'
      ? 'id, name, phone, grade, attendance, branch'
      : 'id, name, grade, attendance, branch'

  let query = supabase.from('leads').select(columns).order('name', { ascending: true })
  if (filters.grade) query = query.eq('grade', filters.grade)
  if (filters.attendance) query = query.eq('attendance', filters.attendance)
  if (filters.branch) query = query.eq('branch', filters.branch)

  const { data: leads, error } = await query
  if (error) throw new Error(error.message)

  const rows = (leads ?? []) as unknown as {
    id: string
    name: string
    phone?: string
    grade: string | null
    attendance: string | null
    branch: string | null
  }[]

  if (rows.length === 0) return { rows: [], attendanceError: null }

  const ids = rows.map((r) => r.id)

  const [marks, homework, exams] = await Promise.all([
    supabase
      .from('attendance')
      .select('lead_id, status, note')
      .eq('session_date', date)
      .in('lead_id', ids),
    supabase
      .from('homework_submissions')
      .select('lead_id, homework_slug, total_score, total_marks, passed, created_at')
      .in('lead_id', ids)
      .order('created_at', { ascending: false }),
    supabase
      .from('exam_submissions')
      .select('lead_id, exam_slug, total_score, total_marks, passed, source, created_at')
      .in('lead_id', ids)
      .order('created_at', { ascending: false }),
  ])

  const markByLead = new Map((marks.data ?? []).map((m) => [m.lead_id, m]))

  type HomeworkRow = {
    lead_id: string
    homework_slug: string
    total_score: number
    total_marks: number
    passed: boolean
    created_at: string
  }
  type ExamRow = {
    lead_id: string
    exam_slug: string
    total_score: number
    total_marks: number
    passed: boolean
    source: string | null
    created_at: string
  }

  // Ordered newest-first above, so the FIRST row seen for a student is their
  // latest. `has` rather than overwrite keeps it that way.
  const latestHomework = new Map<string, HomeworkRow>()
  for (const h of (homework.data ?? []) as HomeworkRow[]) {
    if (h.lead_id && !latestHomework.has(h.lead_id)) latestHomework.set(h.lead_id, h)
  }
  const latestExam = new Map<string, ExamRow>()
  for (const e of (exams.data ?? []) as ExamRow[]) {
    if (e.lead_id && !latestExam.has(e.lead_id)) latestExam.set(e.lead_id, e)
  }

  const registerRows = rows.map((lead) => {
    const mark = markByLead.get(lead.id)
    const hw = latestHomework.get(lead.id)
    const ex = latestExam.get(lead.id)

    return {
      leadId: lead.id,
      name: lead.name,
      phone: role === 'admin' ? (lead.phone ?? null) : null,
      grade: lead.grade,
      attendance: lead.attendance,
      branch: lead.branch,
      status: (mark?.status as AttendanceStatus | undefined) ?? null,
      note: mark?.note ?? null,
      homework: hw
        ? {
            slug: hw.homework_slug,
            score: hw.total_score,
            marks: hw.total_marks,
            passed: hw.passed,
            at: hw.created_at,
          }
        : null,
      exam: ex
        ? {
            slug: ex.exam_slug,
            score: ex.total_score,
            marks: ex.total_marks,
            passed: ex.passed,
            source: ex.source ?? 'online',
            at: ex.created_at,
          }
        : null,
    }
  })

  return { rows: registerRows, attendanceError: marks.error?.message ?? null }
}

/**
 * Marks a student present or absent.
 *
 * An upsert on (lead_id, session_date): pressing a different button for the
 * same student on the same day is a CORRECTION, not a second attendance. A
 * register that accumulates contradictory rows is a register nobody trusts.
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
    { onConflict: 'attempt_key' },
  )

  if (error) throw new Error(error.message)
}

/** The day's totals, for the strip above the list. */
export function summarise(rows: RegisterRow[]) {
  return {
    total: rows.length,
    present: rows.filter((r) => r.status === 'present').length,
    late: rows.filter((r) => r.status === 'late').length,
    absent: rows.filter((r) => r.status === 'absent').length,
    excused: rows.filter((r) => r.status === 'excused').length,
    unmarked: rows.filter((r) => !r.status).length,
    didHomework: rows.filter((r) => r.homework).length,
  }
}
