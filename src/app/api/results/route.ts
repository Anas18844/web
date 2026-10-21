import { NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizePhone, EG_MOBILE } from '@/lib/phone'
import { getSupabaseAdmin } from '@/lib/supabase'
import { resultKey, resultToken } from '@/lib/results'
import { RESULT_TOKENS } from '@/content/results-unit-1'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Look up the unit-1 results for the number the student sat the exam with:
 * online (encrypted reports) and/or on paper at the center (score and rank).
 * Returns, per graded attempt, where its encrypted files live and the key to
 * open them. The browser decrypts; nothing readable leaves this route.
 */
const Body = z.object({ phone: z.string().max(30) })

/** Same line as MIN_ANSWERS in mr-anas-hq …/r04-unit-1-exam/grading/common.py. */
const MIN_ANSWERS = 30

/** The top ten get a certificate and a prize at the center (owner, 2026-10-22). */
const TOP = 10

const fail = (reason: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, reason, message }, { status })

/** «عبد العزيز محمد» → «عبد العزيز», not «عبد». */
const firstName = (full: string) => {
  const w = full.trim().split(/\s+/)
  return /^عبد(ال)?$/.test(w[0]) && w[1] ? `${w[0]} ${w[1]}` : w[0]
}

/**
 * The paper result of a center student (migration 012), with the rank among the
 * center students of the same exam: one plus how many scored higher, so a tie
 * shares the place. Only this student's own row ever leaves the route.
 */
async function centerResult(phone: string) {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('center_results')
    .select('full_name, score, max_score')
    .eq('exam_slug', 'unit-1')
    .eq('phone', phone)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const score = Number(data.score)
  const above = await db
    .from('center_results')
    .select('id', { count: 'exact', head: true })
    .eq('exam_slug', 'unit-1')
    .gt('score', score)
  const same = await db
    .from('center_results')
    .select('id', { count: 'exact', head: true })
    .eq('exam_slug', 'unit-1')
    .eq('score', score)
  if (above.error || same.error) throw above.error ?? same.error
  const rank = (above.count ?? 0) + 1
  return {
    first: firstName(data.full_name),
    score,
    of: Number(data.max_score),
    rank,
    tied: (same.count ?? 1) > 1,
    top: rank <= TOP,
  }
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('bad_request', 'اكتب رقم الموبايل.')
  const phone = normalizePhone(parsed.data.phone)
  if (!EG_MOBILE.test(phone)) return fail('phone', 'الرقم لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.')

  let center: Awaited<ReturnType<typeof centerResult>> = null
  try {
    center = await centerResult(phone)
  } catch {
    return fail('server', 'حصلت مشكلة عندنا. جرّب تاني كمان شوية.', 500)
  }

  const { data, error } = await getSupabaseAdmin()
    .from('unit_exam_attempts')
    .select('id')
    .eq('exam_slug', 'unit-1')
    .eq('phone', phone)
  if (error) return fail('server', 'حصلت مشكلة عندنا. جرّب تاني كمان شوية.', 500)

  const attempts = data ?? []
  const results = attempts
    .map((a) => ({ token: resultToken(a.id), key: resultKey(a.id) }))
    .filter((r) => RESULT_TOKENS.has(r.token))
  if (center) {
    return NextResponse.json({ ok: true, center, results }, { headers: { 'Cache-Control': 'no-store' } })
  }
  if (attempts.length === 0) {
    return fail(
      'not_found',
      'مفيش امتحان بالرقم ده. اكتب نفس الرقم اللي كتبته في ورقة الامتحان، أو اللي امتحنت بيه أونلاين.',
      404,
    )
  }
  if (results.length === 0) {
    // Fewer than 30 answers = an abandoned attempt, never graded (owner, 2026-10-15).
    // Telling those students «the result is coming» would have them wait forever.
    let most = 0
    for (const a of attempts) {
      const { count } = await getSupabaseAdmin()
        .from('unit_exam_answers')
        .select('attempt_id', { count: 'exact', head: true })
        .eq('attempt_id', a.id)
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
  return NextResponse.json({ ok: true, center: null, results }, { headers: { 'Cache-Control': 'no-store' } })
}
