import { NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizePhone, EG_MOBILE } from '@/lib/phone'
import { getSupabaseAdmin } from '@/lib/supabase'
import { resultKey, resultToken } from '@/lib/results'
import { RESULT_TOKENS as UNIT_1 } from '@/content/results-unit-1'
import { RESULT_TOKENS as UNIT_2 } from '@/content/results-unit-2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Look up the unit-exam results for the number the student sat the exam with:
 * online (encrypted reports) and/or on paper at the center (score and rank),
 * for every published exam, newest first. Returns, per graded attempt, where
 * its encrypted files live and the key to open them. The browser decrypts;
 * nothing readable leaves this route.
 */
const Body = z.object({ phone: z.string().max(30) })

/** Newest first. `tokens` = the published online reports of that exam. */
const EXAMS = [
  { slug: 'unit-2', title: 'الوحدة الثانية', tokens: UNIT_2 },
  { slug: 'unit-1', title: 'الوحدة الأولى', tokens: UNIT_1 },
] as const

/** Same line as MIN_ANSWERS in mr-anas-hq …/r04-unit-N-exam/grading/common.py. */
const MIN_ANSWERS = 30

/** The top ten get a certificate and a prize at the center (owner, 2026-10-22). */
const TOP = 10

/**
 * A second number for a student the owner sent with a different digit than
 * the one on file (2026-11-12): same student, one more row so either number
 * finds the result. Left out of the ranking so nobody counts twice.
 */
const ALT_PHONE = 'alt-phone'

const fail = (reason: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, reason, message }, { status })

/** «عبد العزيز محمد» → «عبد العزيز», not «عبد». */
const firstName = (full: string) => {
  const w = full.trim().split(/\s+/)
  return /^عبد(ال)?$/.test(w[0]) && w[1] ? `${w[0]} ${w[1]}` : w[0]
}

/**
 * The center result of a student (migration 012), with the rank among the
 * center students of the same exam. Only this student's own row leaves the route.
 *
 * Two ranks (owner, 2026-10-24):
 * - shown: a tie shares the place and the next score takes the next number
 *   (69.5 → 1, 66 ×3 → 3, 65 → 4), the same place printed on the certificate;
 * - certificate: one plus how many scored higher is 10 or less (the top ten).
 */
async function centerResult(slug: string, phone: string) {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('center_results')
    .select('full_name, score, max_score')
    .eq('exam_slug', slug)
    .eq('phone', phone)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const all = await db.from('center_results').select('score').eq('exam_slug', slug).neq('branch', ALT_PHONE)
  if (all.error) throw all.error
  const score = Number(data.score)
  const scores = (all.data ?? []).map((r) => Number(r.score))
  const above = scores.filter((s) => s > score)
  return {
    first: firstName(data.full_name),
    score,
    of: Number(data.max_score),
    rank: new Set(above).size + 1,
    tied: scores.filter((s) => s === score).length > 1,
    top: above.length + 1 <= TOP,
  }
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('bad_request', 'اكتب رقم الموبايل.')
  const phone = normalizePhone(parsed.data.phone)
  if (!EG_MOBILE.test(phone)) return fail('phone', 'الرقم لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.')

  const db = getSupabaseAdmin()
  const exams = []
  const ungraded: string[] = []
  try {
    for (const ex of EXAMS) {
      const center = await centerResult(ex.slug, phone)
      const { data, error } = await db
        .from('unit_exam_attempts')
        .select('id')
        .eq('exam_slug', ex.slug)
        .eq('phone', phone)
      if (error) throw error
      const attempts = data ?? []
      const results = attempts
        .map((a) => ({ token: resultToken(a.id, ex.slug), key: resultKey(a.id, ex.slug) }))
        .filter((r) => ex.tokens.has(r.token))
      if (center || results.length) exams.push({ slug: ex.slug, title: ex.title, center, results })
      else ungraded.push(...attempts.map((a) => a.id))
    }
  } catch {
    return fail('server', 'حصلت مشكلة عندنا. جرّب تاني كمان شوية.', 500)
  }

  if (exams.length) {
    return NextResponse.json({ ok: true, exams }, { headers: { 'Cache-Control': 'no-store' } })
  }
  if (ungraded.length === 0) {
    return fail(
      'not_found',
      'مفيش امتحان بالرقم ده. اكتب نفس الرقم اللي كتبته في ورقة الامتحان، أو اللي امتحنت بيه أونلاين.',
      404,
    )
  }
  // Fewer than 30 answers = an abandoned attempt, never graded (owner, 2026-10-15).
  // Telling those students «the result is coming» would have them wait forever.
  let most = 0
  for (const id of ungraded) {
    const { count } = await db
      .from('unit_exam_answers')
      .select('attempt_id', { count: 'exact', head: true })
      .eq('attempt_id', id)
    most = Math.max(most, count ?? 0)
  }
  if (most < MIN_ANSWERS) {
    return fail(
      'not_counted',
      'محاولتك اتقفلت قبل ما تحل كفاية أسئلة، فمتحسبتش. لو عندك سؤال كلّمنا على واتساب.',
      404,
    )
  }
  return fail('pending', 'امتحانك وصلنا ✅ والنتيجة لسه بتتجهز. ارجع للصفحة دي تاني قريب.', 404)
}
