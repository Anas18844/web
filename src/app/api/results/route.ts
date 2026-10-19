import { NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizePhone, EG_MOBILE } from '@/lib/phone'
import { getSupabaseAdmin } from '@/lib/supabase'
import { resultKey, resultToken } from '@/lib/results'
import { RESULT_TOKENS } from '@/content/results-unit-1'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Look up the unit-1 results for the number the student sat the exam with.
 * Returns, per graded attempt, where its encrypted files live and the key to
 * open them. The browser decrypts; nothing readable leaves this route.
 */
const Body = z.object({ phone: z.string().max(30) })

/** Same line as MIN_ANSWERS in mr-anas-hq …/r04-unit-1-exam/grading/common.py. */
const MIN_ANSWERS = 30

const fail = (reason: string, message: string, status = 400) =>
  NextResponse.json({ ok: false, reason, message }, { status })

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('bad_request', 'اكتب رقم الموبايل.')
  const phone = normalizePhone(parsed.data.phone)
  if (!EG_MOBILE.test(phone)) return fail('phone', 'الرقم لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.')

  const { data, error } = await getSupabaseAdmin()
    .from('unit_exam_attempts')
    .select('id')
    .eq('exam_slug', 'unit-1')
    .eq('phone', phone)
  if (error) return fail('server', 'حصلت مشكلة عندنا. جرّب تاني كمان شوية.', 500)

  const attempts = data ?? []
  if (attempts.length === 0) {
    return fail('not_found', 'مفيش امتحان بالرقم ده. اكتب نفس الرقم اللي امتحنت بيه.', 404)
  }
  const results = attempts
    .map((a) => ({ token: resultToken(a.id), key: resultKey(a.id) }))
    .filter((r) => RESULT_TOKENS.has(r.token))
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
  return NextResponse.json({ ok: true, results }, { headers: { 'Cache-Control': 'no-store' } })
}
