import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase'
import type { Role, SessionUser } from '@/lib/auth'

/**
 * The only way the dashboard reads leads.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY REDACTION LIVES HERE AND NOT IN THE INTERFACE
 *
 * "The team sees everything except phone numbers" is a security boundary, not
 * a display preference. A hidden column is not a boundary: the row still
 * travels to the browser, and anyone who opens the network tab reads every
 * number in it.
 *
 * So the phone never leaves the database for a team request. `select` is built
 * from the role, the columns are not requested at all, and there is no code
 * path from a team session to a phone number — including the CSV export, which
 * is the door this kind of rule is usually left open on.
 *
 * `whatsapp` is redacted with `phone`. It is a phone number; the fact that it
 * is stored in a different column does not make it a different thing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Lead = {
  id: string
  created_at: string
  name: string
  /** null for a team session — the value was never fetched. */
  phone: string | null
  whatsapp: string | null
  grade: string | null
  attendance: string | null
  branch: string | null
  heard_from: string | null
  intent: string | null
  note: string | null
  status: string
  stage: string
  source: string | null
  page_context: string | null
  completed_at: string | null
}

/** Everything a team member may read. Note what is absent. */
const TEAM_COLUMNS =
  'id, created_at, name, grade, attendance, branch, heard_from, intent, note, status, stage, source, page_context, completed_at'

const ADMIN_COLUMNS = `${TEAM_COLUMNS}, phone, whatsapp`

export function columnsFor(role: Role): string {
  return role === 'admin' ? ADMIN_COLUMNS : TEAM_COLUMNS
}

export type LeadFilters = {
  q?: string
  grade?: string
  status?: string
  stage?: string
  source?: string
  heardFrom?: string
}

/**
 * Note the search behaviour: an admin can search by phone, a team member
 * cannot. Allowing a phone search for a role that cannot see phones would hand
 * back a yes/no oracle for any number someone cares to type, which recovers
 * the data the rule exists to protect one guess at a time.
 */
export async function listLeads(
  role: Role,
  filters: LeadFilters = {},
  limit = 500,
): Promise<Lead[]> {
  let query = getSupabaseAdmin()
    .from('leads')
    .select(columnsFor(role))
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.grade) query = query.eq('grade', filters.grade)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.stage) query = query.eq('stage', filters.stage)
  if (filters.source) query = query.eq('source', filters.source)
  if (filters.heardFrom) query = query.eq('heard_from', filters.heardFrom)

  const q = filters.q?.trim()
  if (q) {
    const safe = q.replace(/[%,()]/g, ' ')
    query = query.or(
      role === 'admin'
        ? `name.ilike.%${safe}%,phone.ilike.%${safe}%,whatsapp.ilike.%${safe}%`
        : `name.ilike.%${safe}%`,
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as Lead[]

  // Belt and braces. The columns were never selected, so this changes nothing
  // today — it is here so that adding `*` to a select in six months fails safe
  // instead of quietly publishing every number in the table.
  if (role !== 'admin') {
    return rows.map((row) => ({ ...row, phone: null, whatsapp: null }))
  }

  return rows
}

export async function getLead(role: Role, id: string): Promise<Lead | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('leads')
    .select(columnsFor(role))
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as unknown as Lead
  return role === 'admin' ? row : { ...row, phone: null, whatsapp: null }
}

// ── Counts ───────────────────────────────────────────────────────────────────

export type Stats = {
  total: number
  complete: number
  partial: number
  fromWebsite: number
  fromManual: number
  last7: number
  previous7: number
  byGrade: Record<string, number>
  byStatus: Record<string, number>
  byHeardFrom: Record<string, number>
  byAttendance: Record<string, number>
  byBranch: Record<string, number>
  /** Thirty days, split by year group — "which grade is actually arriving". */
  daily: { date: string; first: number; second: number }[]
}

/**
 * Every number on the dashboard, computed in one place.
 *
 * Counted in the application rather than with SQL aggregates because the whole
 * set is a few thousand rows at most and one honest pass over it cannot
 * disagree with itself. Nine separate `count(*)` queries can, whenever a row
 * lands between the first and the ninth — and a total that does not equal the
 * sum of its parts is exactly the kind of thing that destroys trust in a
 * dashboard people are supposed to make hard decisions from.
 *
 * Reads no personal columns at all. Statistics do not need names or numbers,
 * so this function cannot leak either, whoever calls it.
 */
export async function getStats(): Promise<Stats> {
  const { data, error } = await getSupabaseAdmin()
    .from('leads')
    .select('created_at, grade, status, stage, source, heard_from, attendance, branch')
    .order('created_at', { ascending: false })
    .limit(10000)

  if (error) throw new Error(error.message)
  const rows = data ?? []

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const tally = (key: string | null | undefined, into: Record<string, number>) => {
    const k = key || 'unknown'
    into[k] = (into[k] ?? 0) + 1
  }

  const stats: Stats = {
    total: rows.length,
    complete: 0,
    partial: 0,
    fromWebsite: 0,
    fromManual: 0,
    last7: 0,
    previous7: 0,
    byGrade: {},
    byStatus: {},
    byHeardFrom: {},
    byAttendance: {},
    byBranch: {},
    daily: [],
  }

  const perDay = new Map<string, { first: number; second: number }>()
  for (let i = 29; i >= 0; i--) {
    perDay.set(new Date(now - i * day).toISOString().slice(0, 10), { first: 0, second: 0 })
  }

  for (const row of rows) {
    const created = new Date(row.created_at as string).getTime()
    const age = now - created

    if (row.stage === 'complete') stats.complete++
    else stats.partial++

    if (row.source === 'manual') stats.fromManual++
    else stats.fromWebsite++

    if (age < 7 * day) stats.last7++
    else if (age < 14 * day) stats.previous7++

    tally(row.grade as string, stats.byGrade)
    tally(row.status as string, stats.byStatus)
    tally(row.heard_from as string, stats.byHeardFrom)
    tally(row.attendance as string, stats.byAttendance)
    if (row.branch) tally(row.branch as string, stats.byBranch)

    const key = new Date(created).toISOString().slice(0, 10)
    const bucket = perDay.get(key)
    if (bucket) {
      if (row.grade === 'second_bacc') bucket.second++
      else bucket.first++
    }
  }

  stats.daily = [...perDay.entries()].map(([date, counts]) => ({ date, ...counts }))

  return stats
}

// ── Writes ───────────────────────────────────────────────────────────────────

export type LeadInput = {
  name: string
  phone: string
  whatsapp?: string | null
  grade: string
  attendance?: string | null
  branch?: string | null
  heard_from?: string | null
  intent?: string | null
  note?: string | null
  status?: string
}

/**
 * Adds a lead by hand — the student who arrived over WhatsApp rather than
 * through the form.
 *
 * Both roles may do this, which is not a contradiction of the read rule: a
 * team member typing a number in already knows it. What they still cannot do
 * is read one back out, including this one, a minute later.
 *
 * `source: 'manual'` is not optional. Without it every conversion rate
 * calculated from this table silently counts phone enquiries as website
 * conversions, and the dashboard starts overstating exactly the thing the
 * business is trying to measure.
 */
export async function createLead(actor: SessionUser, input: LeadInput) {
  const { data, error } = await getSupabaseAdmin()
    .from('leads')
    .insert({
      name: input.name,
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      grade: input.grade,
      attendance: input.attendance || null,
      branch: input.branch || null,
      heard_from: input.heard_from || null,
      intent: input.intent || 'curriculum',
      note: input.note || null,
      status: input.status || 'new',
      stage: 'complete',
      source: 'manual',
      created_by: actor.id,
      page_context: 'dashboard',
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

/** Admin only — the caller is responsible for having called requireAdmin(). */
export async function updateLead(id: string, patch: Partial<LeadInput>) {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) clean[key] = value === '' ? null : value
  }
  if (Object.keys(clean).length === 0) return

  const { error } = await getSupabaseAdmin().from('leads').update(clean).eq('id', id)
  if (error) throw new Error(error.message)
}

/** Admin only. The row is read first so the audit trail can hold what was lost. */
export async function deleteLead(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabaseAdmin()

  const { data: before } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()

  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw new Error(error.message)

  return (before as Record<string, unknown>) ?? null
}
