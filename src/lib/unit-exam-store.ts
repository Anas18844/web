import 'server-only'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AnswerValue, PublicUnitExam } from '@/components/unit-exam/types'

/**
 * Where the unit exam keeps attempts, answers and events.
 *
 * Production: Supabase (migration 011), server-only, RLS with no policies.
 *
 * Local: set `UNIT_EXAM_STORE=file` and the same calls read and write
 * `.private/unit-exam-dev-store.json` instead — so the whole flow (start,
 * resume, save, submit) can be exercised on the owner's machine before the
 * migration has been run, and without test rows in the live database. The file
 * store refuses to run in production.
 */
export type Attempt = {
  id: string
  exam_slug: string
  phone: string
  full_name: string
  student_type: 'online' | 'exam_only'
  contact_consent: boolean
  started_at: string
  ends_at: string
  extended_minutes: number
  submitted_at: string | null
  end_reason: 'submitted' | 'timeout' | null
  order_seed: number
  net_hash: string | null
  device_summary: string | null
  receipt_code: string | null
  final_hash: string | null
  last_seen_at: string
}

export type AnswerRow = {
  question_id: string
  value: AnswerValue | null
  rev: number
  flagged: boolean
  updated_at: string
}

export type NewAttempt = Pick<
  Attempt,
  'exam_slug' | 'phone' | 'full_name' | 'student_type' | 'contact_consent' | 'ends_at' | 'order_seed' | 'net_hash' | 'device_summary'
>

export type IncomingAnswer = { question_id: string; value: AnswerValue | null; rev: number; flagged: boolean }

export interface UnitExamStore {
  getPaper(slug: string): Promise<PublicUnitExam | null>
  findAttempt(slug: string, phone: string): Promise<Attempt | null>
  getAttempt(id: string): Promise<Attempt | null>
  /** Creates the attempt, or returns the one that already exists for that phone. */
  createAttempt(a: NewAttempt): Promise<Attempt>
  updateAttempt(id: string, patch: Partial<Attempt>): Promise<void>
  getAnswers(attemptId: string): Promise<AnswerRow[]>
  /** Writes only rows whose rev is newer than the stored one; returns what was kept. */
  saveAnswers(attemptId: string, rows: IncomingAnswer[]): Promise<{ question_id: string; rev: number }[]>
  addEvent(attemptId: string, type: string, netHash: string | null, detail?: unknown): Promise<void>
  listAttempts(slug: string): Promise<Attempt[]>
  answerCounts(slug: string): Promise<Record<string, number>>
  eventCounts(slug: string): Promise<Record<string, Record<string, number>>>
  addExtension(attemptId: string, minutes: number, reason: string, by: string): Promise<void>
}

export function getUnitExamStore(): UnitExamStore {
  if (process.env.UNIT_EXAM_STORE === 'file') {
    if (process.env.NODE_ENV === 'production') throw new Error('UNIT_EXAM_STORE=file is for local testing only')
    return fileStore
  }
  return supabaseStore
}

// ═══════════════════════════════ Supabase ═══════════════════════════════

const db = () => getSupabaseAdmin()

function must<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data
}

const supabaseStore: UnitExamStore = {
  async getPaper(slug) {
    const r = await db().from('unit_exam_papers').select('paper').eq('slug', slug).maybeSingle()
    return (must(r)?.paper as PublicUnitExam) ?? null
  },
  async findAttempt(slug, phone) {
    const r = await db().from('unit_exam_attempts').select('*').eq('exam_slug', slug).eq('phone', phone).maybeSingle()
    return must(r) as Attempt | null
  },
  async getAttempt(id) {
    const r = await db().from('unit_exam_attempts').select('*').eq('id', id).maybeSingle()
    return must(r) as Attempt | null
  },
  async createAttempt(a) {
    const r = await db().from('unit_exam_attempts').insert(a).select('*').maybeSingle()
    if (r.error) {
      // 23505 = the phone already has an attempt (two taps at once): use that one.
      const existing = await this.findAttempt(a.exam_slug, a.phone)
      if (existing) return existing
      throw new Error(r.error.message)
    }
    return r.data as Attempt
  },
  async updateAttempt(id, patch) {
    must(await db().from('unit_exam_attempts').update(patch).eq('id', id))
  },
  async getAnswers(attemptId) {
    const r = await db().from('unit_exam_answers').select('question_id, value, rev, flagged, updated_at').eq('attempt_id', attemptId)
    return (must(r) ?? []) as AnswerRow[]
  },
  async saveAnswers(attemptId, rows) {
    if (!rows.length) return []
    const stored = await this.getAnswers(attemptId)
    const revs = new Map(stored.map((s) => [s.question_id, s.rev]))
    const fresh = rows.filter((r) => r.rev > (revs.get(r.question_id) ?? -1))
    if (!fresh.length) return []
    const now = new Date().toISOString()
    must(
      await db()
        .from('unit_exam_answers')
        .upsert(fresh.map((r) => ({ attempt_id: attemptId, ...r, updated_at: now })), { onConflict: 'attempt_id,question_id' }),
    )
    return fresh.map((r) => ({ question_id: r.question_id, rev: r.rev }))
  },
  async addEvent(attemptId, type, netHash, detail) {
    await db().from('unit_exam_events').insert({ attempt_id: attemptId, type, net_hash: netHash, detail: detail ?? null })
  },
  async listAttempts(slug) {
    const r = await db().from('unit_exam_attempts').select('*').eq('exam_slug', slug).order('started_at')
    return (must(r) ?? []) as Attempt[]
  },
  async answerCounts(slug) {
    // One query for the whole room (≈100 students × 46 rows), not one per student.
    const ids = (await this.listAttempts(slug)).map((a) => a.id)
    if (!ids.length) return {}
    const r = await db().from('unit_exam_answers').select('attempt_id').in('attempt_id', ids).limit(20000)
    const out: Record<string, number> = {}
    for (const row of (must(r) ?? []) as { attempt_id: string }[]) out[row.attempt_id] = (out[row.attempt_id] ?? 0) + 1
    return out
  },
  async eventCounts(slug) {
    const attempts = await this.listAttempts(slug)
    const ids = attempts.map((a) => a.id)
    if (!ids.length) return {}
    const r = await db().from('unit_exam_events').select('attempt_id, type').in('attempt_id', ids)
    const out: Record<string, Record<string, number>> = {}
    for (const e of (must(r) ?? []) as { attempt_id: string; type: string }[]) {
      out[e.attempt_id] ??= {}
      out[e.attempt_id][e.type] = (out[e.attempt_id][e.type] ?? 0) + 1
    }
    return out
  },
  async addExtension(attemptId, minutes, reason, by) {
    must(await db().from('unit_exam_extensions').insert({ attempt_id: attemptId, minutes, reason, by_user: by }))
  },
}

// ═══════════════════════════════ local file ═══════════════════════════════

type FileDb = {
  attempts: Attempt[]
  answers: (AnswerRow & { attempt_id: string })[]
  events: { attempt_id: string; type: string; at: string; net_hash: string | null; detail: unknown }[]
  extensions: { attempt_id: string; minutes: number; reason: string; by_user: string; at: string }[]
}

const FILE = path.join(process.cwd(), '.private', 'unit-exam-dev-store.json')

function load(): FileDb {
  if (!existsSync(FILE)) return { attempts: [], answers: [], events: [], extensions: [] }
  return JSON.parse(readFileSync(FILE, 'utf-8')) as FileDb
}

function save(d: FileDb) {
  mkdirSync(path.dirname(FILE), { recursive: true })
  writeFileSync(FILE, JSON.stringify(d, null, 1))
}

const fileStore: UnitExamStore = {
  async getPaper() {
    const f = path.join(process.cwd(), '.private', 'unit-1-exam.public.json')
    return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf-8')) as PublicUnitExam) : null
  },
  async findAttempt(slug, phone) {
    return load().attempts.find((a) => a.exam_slug === slug && a.phone === phone) ?? null
  },
  async getAttempt(id) {
    return load().attempts.find((a) => a.id === id) ?? null
  },
  async createAttempt(a) {
    const d = load()
    const existing = d.attempts.find((x) => x.exam_slug === a.exam_slug && x.phone === a.phone)
    if (existing) return existing
    const now = new Date().toISOString()
    const row: Attempt = {
      ...a, id: randomUUID(), started_at: now, extended_minutes: 0, submitted_at: null, end_reason: null,
      receipt_code: null, final_hash: null, last_seen_at: now,
    }
    d.attempts.push(row)
    save(d)
    return row
  },
  async updateAttempt(id, patch) {
    const d = load()
    const a = d.attempts.find((x) => x.id === id)
    if (a) Object.assign(a, patch)
    save(d)
  },
  async getAnswers(attemptId) {
    return load().answers.filter((r) => r.attempt_id === attemptId)
  },
  async saveAnswers(attemptId, rows) {
    const d = load()
    const kept: { question_id: string; rev: number }[] = []
    for (const r of rows) {
      const cur = d.answers.find((x) => x.attempt_id === attemptId && x.question_id === r.question_id)
      if (cur && cur.rev >= r.rev) continue
      const next = { attempt_id: attemptId, ...r, updated_at: new Date().toISOString() }
      if (cur) Object.assign(cur, next)
      else d.answers.push(next)
      kept.push({ question_id: r.question_id, rev: r.rev })
    }
    save(d)
    return kept
  },
  async addEvent(attemptId, type, netHash, detail) {
    const d = load()
    d.events.push({ attempt_id: attemptId, type, at: new Date().toISOString(), net_hash: netHash, detail: detail ?? null })
    save(d)
  },
  async listAttempts(slug) {
    return load().attempts.filter((a) => a.exam_slug === slug)
  },
  async answerCounts(slug) {
    const d = load()
    const out: Record<string, number> = {}
    for (const a of d.attempts.filter((x) => x.exam_slug === slug)) {
      out[a.id] = d.answers.filter((r) => r.attempt_id === a.id).length
    }
    return out
  },
  async eventCounts() {
    const out: Record<string, Record<string, number>> = {}
    for (const e of load().events) {
      out[e.attempt_id] ??= {}
      out[e.attempt_id][e.type] = (out[e.attempt_id][e.type] ?? 0) + 1
    }
    return out
  },
  async addExtension(attemptId, minutes, reason, by) {
    const d = load()
    d.extensions.push({ attempt_id: attemptId, minutes, reason, by_user: by, at: new Date().toISOString() })
    save(d)
  },
}
