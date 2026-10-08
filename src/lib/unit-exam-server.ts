import 'server-only'
import { createHash, createHmac, randomBytes } from 'node:crypto'
import { deriveSecret, signPayload, verifyPayload } from '@/lib/session-crypto'
import { resolveConfig } from '@/lib/supabase'
import { UNIT_EXAM } from '@/content/unit-exam'
import type { McqItem, PublicUnitExam } from '@/components/unit-exam/types'

/**
 * Server helpers for the unit exam: the attempt pass, the network fingerprint,
 * and the per-student paper.
 */
export type UnitExamPass = { aid: string; phone: string; slug: string }

function secret() {
  return deriveSecret(process.env.DASHBOARD_SESSION_SECRET, resolveConfig().key)
}

/** Valid until an hour after the exam closes — long enough for any resume. */
export function issuePass(p: UnitExamPass): string {
  const ttl = Date.parse(UNIT_EXAM.closesAt) + 3_600_000 - Date.now()
  return signPayload(p, secret(), Math.max(ttl, 3_600_000))
}

export function readPass(token: unknown): UnitExamPass | null {
  if (typeof token !== 'string' || token.length > 2000) return null
  return verifyPayload<UnitExamPass>(token, secret())
}

/**
 * Same network → same value; the address itself is never stored. Mobile
 * carriers put strangers behind one address (CGNAT) and siblings share a home
 * router, so this is a pointer for review, never evidence on its own.
 */
export function netHash(req: Request): string | null {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    null
  if (!ip) return null
  return createHmac('sha256', secret()).update(`unit-exam-net:${ip}`).digest('hex').slice(0, 16)
}

export function deviceSummary(req: Request): string | null {
  return req.headers.get('user-agent')?.slice(0, 160) ?? null
}

export function newSeed(): number {
  return randomBytes(4).readUInt32BE(0) & 0x7fffffff
}

export function receiptCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join('')
}

export function answersHash(rows: { question_id: string; value: unknown }[]): string {
  const sorted = [...rows].sort((a, b) => a.question_id.localeCompare(b.question_id))
  return createHash('sha256').update(JSON.stringify(sorted.map((r) => [r.question_id, r.value]))).digest('hex')
}

/** Deterministic PRNG, so a resume shows the student the very same order. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * This student's paper: the multiple-choice questions in their own order, and
 * each question's options in their own order. Answers are still saved as the
 * ORIGINAL option index, so marking never needs to know the shuffle.
 * Every other section keeps the printed order.
 */
export function personalize(paper: PublicUnitExam, seed: number): PublicUnitExam {
  const rand = mulberry32(seed)
  const mcqs = shuffle(paper.items.filter((i): i is McqItem => i.type === 'mcq'), rand).map((q) => ({
    ...q,
    optionOrder: shuffle(q.options.map((_, i) => i), rand),
  }))
  const rest = paper.items.filter((i) => i.type !== 'mcq')
  const items = [...mcqs, ...rest].map((item, k) => ({ ...item, n: k + 1 }))
  return { ...paper, items }
}
